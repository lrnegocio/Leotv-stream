interface AdminUser {
  id: string;
  username: string;
  password: string;
  email: string;
}

interface StreamUser {
  id: string;
  username: string;
  password: string;
  email: string;
  expiryDate: string;
  active: boolean;
}

const ADMINS_KEY = 'leo_admins';
const USERS_KEY = 'leo_users';

const DEFAULT_ADMIN: AdminUser = {
  id: 'admin_default',
  username: 'lrnegocio',
  password: '135796lR@',
  email: 'admin@leotv.com'
};

export const authService = {
  loginAdmin: (username: string, password: string) => {
    if (typeof window === 'undefined') return { success: false, error: 'Client-side only' };
    
    let admins = JSON.parse(localStorage.getItem(ADMINS_KEY) || '[]');
    
    if (admins.length === 0) {
      admins = [DEFAULT_ADMIN];
      localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
    }

    const admin = admins.find((a: AdminUser) => 
      a.username === username && a.password === password
    );
    
    if (admin) {
      localStorage.setItem('adminId', admin.id);
      localStorage.setItem('adminUsername', admin.username);
      return { success: true, admin };
    }
    return { success: false, error: 'Credenciais inválidas' };
  },

  loginUser: (username: string, password: string) => {
    if (typeof window === 'undefined') return { success: false, error: 'Client-side only' };
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    const user = users.find((u: StreamUser) => 
      u.username === username && 
      u.password === password && 
      u.active &&
      new Date(u.expiryDate) > new Date()
    );
    
    if (user) {
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userUsername', user.username);
      return { success: true, user };
    }
    return { success: false, error: 'Credenciais inválidas ou conta expirada' };
  },

  isAdminLoggedIn: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('adminId');
  },

  isUserLoggedIn: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('userId');
  },

  logoutAdmin: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminUsername');
  },

  logoutUser: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('userId');
    localStorage.removeItem('userUsername');
  }
};
