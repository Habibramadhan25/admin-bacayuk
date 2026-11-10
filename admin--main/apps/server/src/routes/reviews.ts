import { Router, Request, Response } from 'express';
import { pool } from '../db/connection';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/reviews - Get reviews (optionally filtered by bookId)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { bookId } = req.query;

    let query = `
      SELECT 
        r.id,
        r.book_id AS bookId,
        r.user_id AS userId,
        r.user_name AS userName,
        r.user_avatar AS userAvatar,
        r.rating,
        r.comment,
        r.created_at AS createdAt,
        b.title AS bookTitle
      FROM book_reviews r
      LEFT JOIN books b ON r.book_id = b.id
    `;
    const params: any[] = [];

    if (bookId && typeof bookId === 'string') {
      query += ` WHERE r.book_id = ?`;
      params.push(bookId);
    }

    query += ` ORDER BY r.created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return res.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/reviews - Add new review
router.post('/', async (req: Request, res: Response) => {
  try {
    const { bookId, userId, userName, userAvatar, rating = 5, comment } = req.body;

    if (!bookId || !comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Buku dan ulasan (komentar) wajib diisi',
      });
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const finalUserName = userName?.trim() || 'Pembaca BacaYuk';
    const finalRating = Math.min(5, Math.max(1, Number(rating) || 5));
    const finalAvatar =
      userAvatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';

    // Insert review
    await pool.query(
      `INSERT INTO book_reviews (id, book_id, user_id, user_name, user_avatar, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, bookId, userId || null, finalUserName, finalAvatar, finalRating, comment.trim()]
    );

    // Recalculate average rating & review count for the book
    const [stats] = await pool.query<RowDataPacket[]>(
      `SELECT AVG(rating) as avgRating, COUNT(id) as totalReviews FROM book_reviews WHERE book_id = ?`,
      [bookId]
    );

    if (stats.length > 0 && stats[0].avgRating !== null) {
      const newAvg = Number(Number(stats[0].avgRating).toFixed(1));
      const newTotal = Number(stats[0].totalReviews) || 1;
      await pool.query(
        `UPDATE books SET rating = ?, total_reviews = ? WHERE id = ?`,
        [newAvg, newTotal, bookId]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Ulasan berhasil ditambahkan',
      data: {
        id: reviewId,
        bookId,
        userId,
        userName: finalUserName,
        userAvatar: finalAvatar,
        rating: finalRating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error adding review:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find the review first to get bookId
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT book_id as bookId FROM book_reviews WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ulasan tidak ditemukan' });
    }

    const bookId = rows[0].bookId;

    await pool.query(`DELETE FROM book_reviews WHERE id = ?`, [id]);

    // Recalculate rating & reviews count
    const [stats] = await pool.query<RowDataPacket[]>(
      `SELECT AVG(rating) as avgRating, COUNT(id) as totalReviews FROM book_reviews WHERE book_id = ?`,
      [bookId]
    );

    const newAvg = stats.length > 0 && stats[0].avgRating !== null ? Number(Number(stats[0].avgRating).toFixed(1)) : 5.0;
    const newTotal = stats.length > 0 ? Number(stats[0].totalReviews) : 0;

    await pool.query(
      `UPDATE books SET rating = ?, total_reviews = ? WHERE id = ?`,
      [newAvg, newTotal, bookId]
    );

    return res.json({ success: true, message: 'Ulasan berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
