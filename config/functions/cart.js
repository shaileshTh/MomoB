const TAX_RATE = 0.08;

const cartSubtotal = (cart) => {
    const subTotal = cart.reduce((counter, dish) => {
        return counter + dish.price_in_cents * dish.quantity
    }, 0)
    return subTotal 
}

const cartTaxes = (cart) => {
    const subTotal = cartSubtotal(cart) 

    return subTotal * TAX_RATE
}

const cartTotal = (cart) => {
    const subTotal = cartSubtotal(cart)
    const total = subTotal + cartTaxes(cart)
    return Math.round(total);
}

module.exports = {
    cartSubtotal,
    cartTotal,
    cartTaxes  
}