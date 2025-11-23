const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({ error: error.errors[0].message });
  }
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['worker', 'employer']).optional(),
  // Add other profile fields validation as needed
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1)
}).refine(data => data.email || data.phone, {
    message: "Either email or phone is required"
});

const jobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(2),
  salary: z.number().positive(),
  skill: z.string().optional(),
  availability: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional()
});

const shiftSchema = z.object({
    jobId: z.number().int().positive(),
    title: z.string().min(3),
    date: z.string().datetime(), // Expect ISO 8601 string
    startTime: z.string(),
    endTime: z.string(),
    location: z.string().optional(),
    payment: z.number().positive().optional()
});

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    jobSchema,
    shiftSchema
};
