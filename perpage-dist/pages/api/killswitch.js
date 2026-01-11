export default async function handler(req, res) {
  const killed = process.env.KILLSWITCH === 'true';
  return res.status(200).json({ killed });
}
