const stripe = require('stripe')('sk_test_51RVccZQjNQmqXkk9WT6SYewjwEXkkSwak6MVBm1vtRxVjWHWM5kKjwQTebfsPRbLJojXLnvoLAs5mfZGTiI79mVW007Whr1zWL');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.')); 

app.use((req, res, next) => {
    // Rejestrujemy tylko wejścia na stronę główną (GET /)
    if (req.path === '/' && req.method === 'GET') {
        const date = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
        console.log(`[WIZYTA] ${date} - Ktoś wszedł na stronę NEXA`);
    }
    next();
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    // Pobieramy produkty oraz dodatkowe dane wysyłkowe wysłane z index.html
    const { items, shipping, discountActive } = req.body;

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'pln',
        product_data: { 
          name: item.name, 
          images: [item.img] 
        },
        unit_amount: Math.round(item.price * 100), 
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik', 'p24'],
      line_items: lineItems,
      mode: 'payment',
      
      // 1. WYMUSZENIE ZEBRANIA ADRESU W STRIPE
      shipping_address_collection: {
        allowed_countries: ['PL'], // Ograniczamy do Polski
      },

      // 2. PRZEKAZANIE DODATKOWYCH DANYCH (np. kodu paczkomatu)
      // Te dane zobaczysz w panelu Stripe w sekcji "Metadane"
      metadata: {
        paczkomat: shipping ? shipping.inpost : 'Nie podano',
        klient_imie: shipping ? shipping.name : 'Brak danych'
      },

      success_url: 'http://localhost:4242', 
      cancel_url: 'http://localhost:4242',  
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Błąd Stripe:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 4242;
app.listen(PORT, () => console.log(`>>> NEXA System Live na http://localhost:${PORT}`));
