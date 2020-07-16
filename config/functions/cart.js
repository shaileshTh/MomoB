const TAX_RATE = 0.08;

const cartSubtotal = (cart) => {
    const subTotal = cart.reduce((counter, dish) => {
        return counter + dish.price_in_cents * dish.quantity
    }, 0)
    return subTotal 
}

const cartTotal = (cart) => {
    const subTotal = cartSubtotal(cart)
    const total = subTotal + subTotal * TAX_RATE;
    return Math.round(total);
}

module.exports = {
    cartSubtotal,
    cartTotal   
}