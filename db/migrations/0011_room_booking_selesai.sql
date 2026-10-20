-- Add 'Selesai' status to room bookings: marks a booking whose room use has
-- finished, removing it from the calendar while keeping it in history.
ALTER TABLE room_bookings
MODIFY COLUMN status ENUM('Pending', 'Disetujui', 'Ditolak', 'Selesai') DEFAULT 'Pending';
