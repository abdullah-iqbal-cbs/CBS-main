import { PrismaClient} from "../../prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

// GET /contacts?query=params
const getContacts = async (req, res) => {
    try {
        const contacts = await prisma.contact.findMany({});
        return res.status(200).json({ success: true, data: contacts });
    } catch (error) {
        console.error('getContacts error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
    }
};

// GET /contact/:userId
const getContactById = async (req, res) => {
    try {
        const rawId = req.params.userId;
        const userId = /^\d+$/.test(rawId) ? Number(rawId) : rawId; // support numeric or string IDs (UUID)
        const contact = await prisma.contact.findUnique({ where: { userId } });

        if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

        return res.status(200).json({ success: true, data: contact });
    } catch (error) {
        console.error('getContactById error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch contact' });
    }
};

export default {
    getContacts,
    getContactById,
};