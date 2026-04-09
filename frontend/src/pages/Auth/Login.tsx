import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FaEye } from "react-icons/fa";
import { LuEyeClosed } from "react-icons/lu";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      await login(email, password);
      toast.success('Login realizado com sucesso');
      navigate('/');
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'Erro ao fazer login';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-xl p-8 shadow-xl mx-10">
        <h1 className="text-2xl font-bold mb-6 text-center">Entrar</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Senha
            </label>
            <div className='relative'>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-200"
              >
                {showPassword ? <LuEyeClosed /> : <FaEye />}
              </button>
            </div>

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-slate-300">
          Não tem conta?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

