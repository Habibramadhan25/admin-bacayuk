import { Router, Request, Response } from 'express';
import { pool } from '../db/connection';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/books - list books with optional search, category, featured, popular query params
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, category, featured, popular } = req.query;

    let query = `
      SELECT 
        b.id,
        b.title,
        b.slug,
        b.author,
        b.category_id AS categoryId,
        c.name AS category,
        b.cover_url AS coverUrl,
        b.synopsis,
        b.language,
        b.total_pages AS totalPages,
        b.publisher,
        b.published_year AS publishedYear,
        b.rating,
        b.total_reviews AS reviewsCount,
        b.is_featured AS isFeatured,
        b.is_popular AS isPopular,
        b.epub_or_content_url AS epubOrContentUrl,
        b.epub_or_content_url AS fileUrl,
        b.created_at AS createdAt
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (q && typeof q === 'string' && q.trim().length > 0) {
      query += ` AND (b.title LIKE ? OR b.author LIKE ? OR c.name LIKE ?)`;
      const searchPattern = `%${q.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
      query += ` AND (LOWER(c.name) = LOWER(?) OR LOWER(c.slug) = LOWER(?))`;
      params.push(category.trim(), category.trim());
    }

    if (featured === 'true' || featured === '1') {
      query += ` AND b.is_featured = 1`;
    }

    if (popular === 'true' || popular === '1') {
      query += ` AND b.is_popular = 1`;
    }

    query += ` ORDER BY b.rating DESC, b.created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return res.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching books from MySQL:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/books/:id - get single book with chapter count
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        b.id,
        b.title,
        b.slug,
        b.author,
        b.category_id AS categoryId,
        c.name AS category,
        b.cover_url AS coverUrl,
        b.synopsis,
        b.language,
        b.total_pages AS totalPages,
        b.publisher,
        b.published_year AS publishedYear,
        b.rating,
        b.total_reviews AS reviewsCount,
        b.is_featured AS isFeatured,
        b.is_popular AS isPopular,
        b.epub_or_content_url AS epubOrContentUrl,
        b.epub_or_content_url AS fileUrl,
        b.created_at AS createdAt
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ? OR b.slug = ?
      LIMIT 1
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [id, id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error('Error fetching book detail:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/books/:id/chapters - get book chapters
router.get('/:id/chapters', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id,
        book_id AS bookId,
        chapter_number AS chapterNumber,
        title,
        content,
        created_at AS createdAt
      FROM book_chapters
      WHERE book_id = ?
      ORDER BY chapter_number ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    return res.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching chapters:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/books - create new book
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      author,
      categoryId,
      coverUrl,
      synopsis,
      description,
      language = 'Indonesia',
      totalPages = 150,
      publisher,
      publishedYear = 2026,
      rating = 5.0,
      isFeatured = false,
      isPopular = false,
      epubOrContentUrl,
      fileUrl,
      chapters = [],
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({ success: false, message: 'Judul dan Penulis buku wajib diisi' });
    }

    const id = req.body.id || `b_${Date.now()}`;
    const slugBase = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;
    const finalCoverUrl = coverUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
    const finalSynopsis = synopsis || description || 'Buku digital BacaYuk.';
    const finalContentUrl = fileUrl || epubOrContentUrl || null;

    await pool.query(
      `INSERT INTO books (
        id, title, slug, author, category_id, cover_url, synopsis,
        language, total_pages, publisher, published_year, rating,
        total_reviews, is_featured, is_popular, epub_or_content_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        slug,
        author,
        categoryId || null,
        finalCoverUrl,
        finalSynopsis,
        language,
        Number(totalPages) || 150,
        publisher || null,
        Number(publishedYear) || 2026,
        Number(rating) || 5.0,
        0,
        Boolean(isFeatured) ? 1 : 0,
        Boolean(isPopular) ? 1 : 0,
        finalContentUrl,
      ]
    );

    // Insert chapters jika disertakan
    if (Array.isArray(chapters) && chapters.length > 0) {
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        const chId = ch.id || `ch_${id}_${i + 1}`;
        await pool.query(
          `INSERT INTO book_chapters (id, book_id, chapter_number, title, content)
           VALUES (?, ?, ?, ?, ?)`,
          [chId, id, i + 1, ch.title || `Bab ${i + 1}`, ch.content || '']
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Buku berhasil ditambahkan',
      data: { id, title, slug, author },
    });
  } catch (error: any) {
    console.error('Error creating book:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/books/:id - update existing book
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      categoryId,
      coverUrl,
      synopsis,
      description,
      language,
      totalPages,
      publisher,
      publishedYear,
      rating,
      isFeatured,
      isPopular,
      epubOrContentUrl,
      fileUrl,
    } = req.body;

    const finalSynopsis = synopsis || description;
    const finalContentUrl = fileUrl !== undefined ? fileUrl : epubOrContentUrl;

    await pool.query(
      `UPDATE books SET
        title = COALESCE(?, title),
        author = COALESCE(?, author),
        category_id = COALESCE(?, category_id),
        cover_url = COALESCE(?, cover_url),
        synopsis = COALESCE(?, synopsis),
        language = COALESCE(?, language),
        total_pages = COALESCE(?, total_pages),
        publisher = COALESCE(?, publisher),
        published_year = COALESCE(?, published_year),
        rating = COALESCE(?, rating),
        is_featured = COALESCE(?, is_featured),
        is_popular = COALESCE(?, is_popular),
        epub_or_content_url = COALESCE(?, epub_or_content_url)
      WHERE id = ?`,
      [
        title,
        author,
        categoryId,
        coverUrl,
        finalSynopsis,
        language,
        totalPages,
        publisher,
        publishedYear,
        rating,
        isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
        isPopular !== undefined ? (isPopular ? 1 : 0) : null,
        finalContentUrl,
        id,
      ]
    );

    return res.json({ success: true, message: 'Buku berhasil diperbarui' });
  } catch (error: any) {
    console.error('Error updating book:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/books/:id - delete book
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM books WHERE id = ?`, [id]);
    return res.json({ success: true, message: 'Buku berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting book:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
