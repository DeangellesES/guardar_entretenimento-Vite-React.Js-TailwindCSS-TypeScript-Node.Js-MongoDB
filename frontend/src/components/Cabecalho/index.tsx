// import { Link } from "react-router-dom";

// function Cabecalho() {
//     return (
//         <header className="py-4 flex gap-10 justify-center text-white font-bold fixed w-full z-20 border-b border-gray-300/20 bg-[rgba(1,4,48,0.6)] backdrop-blur-md">
//             <Link href="" to="/">Assistindo</Link>
//             <Link href="" to="/pretendo">Quero Assistir</Link>
//         </header>
//     )
// }

// export { Cabecalho }

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Cabecalho() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <header className="py-4 px-6 flex items-center justify-between  text-white font-bold fixed w-full z-20 border-b border-gray-300/20 bg-[rgba(1,4,48,0.6)] backdrop-blur-md">

            <div className="w-[120px]"></div>

            <nav className="flex gap-8">
                <Link to="/">Assistindo</Link>
                <Link to="/pretendo">Quero Assistir</Link>
            </nav>

            {isAuthenticated && (
                <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-200">{user?.email}</span>
                    <button
                        onClick={handleLogout}
                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold hover:bg-red-500 transition-colors"
                    >
                        Sair
                    </button>
                </div>
            )}
        </header>
    );
}

export { Cabecalho };