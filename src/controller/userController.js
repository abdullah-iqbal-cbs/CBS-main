import { PrismaClient} from "../../prisma/generated/prisma/index.js";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_NUMBER } from "../utils/constants.js";

const prisma = new PrismaClient();

const sanitizeUser = (user) => {
    // remove sensitive fields (e.g. password) before returning to client
    if (!user) return user;
    delete user.password;
    return user;
};

// GET /users?search=abc&page=1&limit=20
const getUsers = async (req, res) => {
    try {
        // @TODO: enhance filtering, sorting etc. as needed
        const search = (req.query.search || '').trim();
        const page = Math.max(1, parseInt(req.query.page, 10) || DEFAULT_PAGE_NUMBER);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE);
        const skip = (page - 1) * limit;

        const where = search
            ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }
            : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { id: 'asc' },
            }),
            prisma.user.count({ where }),
        ]);

        const result = users.map(sanitizeUser);
        
        const previousPageUrl = page > 1 ? `/users?search=${encodeURIComponent(search)}&page=${page - 1}&limit=${limit}` : null;
        const nextPageUrl = total > page * limit ? `/users?search=${encodeURIComponent(search)}&page=${page + 1}&limit=${limit}` : null;
        return res.status(200).json({
            success: true,
            data: result,
            meta: { total, page, limit, next: nextPageUrl, previous: previousPageUrl },
        });
    } catch (error) {
        console.error('getUsers error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

// GET /users/:id
const getUserById = async (req, res) => {
    try {
        const rawId = req.params.id;
        const id = /^\d+$/.test(rawId) ? Number(rawId) : rawId; // support numeric or string IDs (UUID)
        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.status(200).json({ success: true, data: sanitizeUser(user) });
    } catch (error) {
        console.error('getUserById error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
};

export default {
    getUsers,
    getUserById,
};