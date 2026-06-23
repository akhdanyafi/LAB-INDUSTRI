-- Add quantity (jumlah aset/alat) column to items table
ALTER TABLE items
ADD COLUMN quantity INT NOT NULL DEFAULT 1 AFTER qr_code;
