'use strict';
const stripe = require('stripe')('sk_test_51H4f83BDMxRrTIJtzhDaOgxrN5yRAPC5a88QkevvyOkUpRTDXUrgRbNerY6YvWiAXCpmxro5ZBw6a7eFlyJrbpFR00Nu4SSQWK');
const { sanitizeEntity } = require('strapi-utils');


/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    setUpStripe: async(ctx) => {
        let total = 1000;
        let validatedCart = [];
        let receiptCart = []

        //through ctx.request.body
        //we will receive the products and the quantity
        const {cart} = ctx.request.body

        await Promise.all(cart.map(async dish => {
            const validatedDish = await strapi.services.dish.findOne({
                id: dish.id
            })
            // console.log("vDish", validatedDish)
            if(validatedDish){
                validatedDish.quantity = dish.quantity;
                validatedCart.push(validatedDish)

                receiptCart.push({
                    id: dish.id,
                    quantity: dish.quantity
                })
            }
            return validatedDish
        }));
        // console.log("vCart", validatedCart)

        total = strapi.config.functions.cart.cartTotal(validatedCart)
        
        // console.log("total: ", total)

        try{
            const paymentIntent = await stripe.paymentIntents.create({
                amount: total,
                currency: 'usd',
                // Verify your integration in this guide by including this parameter
                metadata: {cart: JSON.stringify(receiptCart)},
            });

            return paymentIntent
        }catch(err){
            return {error: err.raw.message}
        }
    },
    create: async (ctx) => {
        const{
            paymentIntent,
            customer_name,
            delivery_address,
            delivery_zip,
            delivery_instructions,
            phone_number,
            email,
            cart
        } = ctx.request.body

        let paymentInfo
        try{
            paymentInfo = await stripe.paymentIntents.retrieve(paymentIntent.id)
            if(paymentInfo.status !== 'succeeded'){
                throw{message: "You still have to pay"}
            }
        }catch(err){
            ctx.response.status = 402
            return{error: err.message}
        }

        const alreadyExistingOrder = await strapi.services.order.find({
            payment_intent_id: paymentIntent.id
        })

        if(alreadyExistingOrder && alreadyExistingOrder.length > 0){
            ctx.response.status = 402
            return {error: "This payment intent was already used. Try reloading the page."}
        }

        const payment_intent_id = paymentIntent.id



        // console.log("order.create cart", cart)
        let product_quantity = []
        let dishes = []
        let sanitizedCart = []


        await Promise.all(cart.map(async dish => {
            const foundDish = await strapi.services.dish.findOne({
                id: dish.strapiId
            })

            if(foundDish){
                product_quantity.push({
                    id: dish.strapiId,
                    quantity: dish.quantity
                })

                dishes.push(foundDish)
                sanitizedCart.push(
                    {...foundDish, ...{quantity: dish.quantity}}
                )
            }

            return foundDish
        }))

        // console.log("order.create product_quantity", product_quantity)
        // console.log("order.create dishes", dishes)
        // console.log("order.create sanitizedCart", sanitizedCart)

        let subtotal_in_cents = parseInt(strapi.config.functions.cart.cartSubtotal(sanitizedCart))
        let tax_in_cents = parseInt(strapi.config.functions.cart.cartTaxes(sanitizedCart))
        let total_in_cents = parseInt(strapi.config.functions.cart.cartTotal(sanitizedCart))

        if(paymentInfo.amount !== total_in_cents){
            ctx.response.status = 402
            return {error: "Amount paid is different from amount"}            
        }
 
        const entry = {
            customer_name,
            delivery_address,
            delivery_zip,
            delivery_instructions,
            phone_number,
            email,

            product_quantity,
            dishes,

            subtotal_in_cents,
            tax_in_cents,
            total_in_cents,
            payment_intent_id
        }

        const entity = await strapi.services.order.create(entry);
        return sanitizeEntity(entity, { model: strapi.models.order });
      }
};
