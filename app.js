```javascript
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Express Server Running');
});

app.post('/api/submit', (req, res) => {
    const { name, email } = req.body;
    res.send(`Hello ${name}, your email is ${email}`);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
```