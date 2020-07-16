'use strict';
const stripe = require('stripe')('sk_test_51H4f83BDMxRrTIJtzhDaOgxrN5yRAPC5a88QkevvyOkUpRTDXUrgRbNerY6YvWiAXCpmxro5ZBw6a7eFlyJrbpFR00Nu4SSQWK');

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
            console.log("vDish", validatedDish)
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
        console.log("vCart", validatedCart)

        total = strapi.config.functions.cart.cartTotal(validatedCart)
        
        console.log("total: ", total)

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
    }
};
