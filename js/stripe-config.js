// Stripe Configuration
// Replace these price IDs with your actual Stripe price IDs from your dashboard

window.STRIPE_CONFIG = {
    // Replace these with your actual Stripe price IDs
    priceIds: {
        '2h': 'price_REPLACE_WITH_2H_PRICE_ID',          // 2h/semana - 65€/mes
        '2h30': 'price_REPLACE_WITH_2H30_PRICE_ID',      // 2h30/semana - 75€/mes  
        '3h30': 'price_REPLACE_WITH_3H30_PRICE_ID',      // 3h30/semana - 90€/mes
        '4h': 'price_REPLACE_WITH_4H_PRICE_ID',          // 4h/semana - 100€/mes
        '4h30': 'price_REPLACE_WITH_4H30_PRICE_ID',      // 4h30/semana - 110€/mes
        '6h': 'price_REPLACE_WITH_6H_PRICE_ID',          // 6h/semana - 120€/mes
        'lab': 'price_REPLACE_WITH_LAB_PRICE_ID'         // LAB Creativo - 50€/mes
    }
}; 