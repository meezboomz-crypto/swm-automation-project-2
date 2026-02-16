const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'swm_database.db');
const db = new sqlite3.Database(dbPath);

const JOB_TYPES = [
    'General',
    'Straight Turning', 'Facing', 'Taper Turning',
    'Thread Cutting', 'Boring', 'Grooving', 'Form Turning', 'Knurling',
    'CNC Turning', 'Maintenance', 'Job Shop'
];
const STATUSES = ['Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'];
const CUSTOMERS = ['Company A', 'Company B', 'John Doe', 'Jane Smith', 'Tech Corp', 'Factory X', 'Studio Y'];
const ITEMS = [
    { desc: 'Lathe Work', price: 500 },
    { desc: 'Milling', price: 1200 },
    { desc: 'Welding', price: 300 },
    { desc: 'Material Cost (Steel)', price: 800 },
    { desc: 'Material Cost (Aluminum)', price: 1500 },
    { desc: 'Labor', price: 400 },
    { desc: 'Design Fee', price: 2000 }
];

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function generateJob(index) {
    const id = crypto.randomUUID();
    const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    const type = JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const createdAt = randomDate(new Date(2023, 0, 1), new Date());

    // Generate 1-5 items
    const numItems = Math.floor(Math.random() * 5) + 1;
    const jobItems = [];
    let subtotal = 0;

    for (let i = 0; i < numItems; i++) {
        const itemTemplate = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        const price = itemTemplate.price * (0.8 + Math.random() * 0.4); // +/- 20% variation
        jobItems.push({
            description: itemTemplate.desc,
            price: parseFloat(price.toFixed(2))
        });
        subtotal += price;
    }

    const vat = subtotal * 0.07;
    const estimatedPrice = subtotal + vat;

    return {
        id,
        customer,
        type,
        status,
        subtotal: parseFloat(subtotal.toFixed(2)),
        vat: parseFloat(vat.toFixed(2)),
        estimatedPrice: parseFloat(estimatedPrice.toFixed(2)),
        createdAt,
        items: jobItems
    };
}

console.log("Generating 100 dummy jobs...");

db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Clear existing data
    db.run("DELETE FROM job_items");
    db.run("DELETE FROM jobs");

    const stmtJob = db.prepare("INSERT INTO jobs (id, customer_name, job_type, subtotal, vat, estimated_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const stmtItem = db.prepare("INSERT INTO job_items (job_id, description, price) VALUES (?, ?, ?)");

    for (let i = 0; i < 100; i++) {
        const job = generateJob(i);

        stmtJob.run(
            job.id,
            job.customer,
            job.type,
            job.subtotal,
            job.vat,
            job.estimatedPrice,
            job.status,
            job.createdAt
        );

        job.items.forEach(item => {
            stmtItem.run(job.id, item.description, item.price);
        });
    }

    stmtJob.finalize();
    stmtItem.finalize();

    db.run("COMMIT", (err) => {
        if (err) {
            console.error("Error seeding jobs:", err);
        } else {
            console.log("Successfully added 100 dummy jobs.");
        }
        db.close();
    });
});
