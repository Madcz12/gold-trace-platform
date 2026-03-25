import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const token = header.split(' ')[1]; // Obtiene el token del header
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verifica el token

    const user = await User.findByPk(decoded.id); // Busca el usuario por el id del token
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    req.user = user; // Asigna el usuario a la solicitud
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const requireRole = (...roles) => { // Verifica que el usuario tenga el rol requerido
  return (req, res, next) => { // Retorna una función que recibe la solicitud, la respuesta y la función next
    if (!req.user) { // Verifica que el usuario esté autenticado
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.role)) { // Verifica que el usuario tenga el rol requerido
      return res.status(403).json({ error: 'No tiene permisos para esta acción' });
    }
    next(); // Pasa al siguiente middleware
  };
};
