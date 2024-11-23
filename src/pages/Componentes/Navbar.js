import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import logo from '../../images/logo_la.png';
import { useState } from 'react';

function NavBar() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('auth'); 
    navigate('/'); 
  };

  const confirmLogout = () => {
    handleLogout();
    setIsModalOpen(false);
  };

  return (
    <>
      <nav className="bg-black">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <img src={logo} className="h-8" alt="LA PaintBall" />
          <button data-collapse-toggle="navbar-default" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15"/>
            </svg>
          </button>
          <div className="hidden w-full md:block md:w-auto" id="navbar-default">
            <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
              <li>
                <Link to="/addjogo" className="text-white hover:text-primary duration-150">Iniciar jogo</Link>
              </li>
              <li>
                <Link to="/cadjog" className="text-white hover:text-primary duration-150">Cadastro</Link>
              </li>
              <li>
                <Link to="/cadequipe" className="text-white hover:text-primary duration-150">Pre-agendamento</Link>
              </li>
              <li>
                <Link to="/financeiro" className="text-white hover:text-primary duration-150">Financeiro</Link>
              </li>
              <li>
                <Link to="/estoque" className="text-white hover:text-primary duration-150">Estoque</Link>
              </li>
              <li>
                <Link to="/preagenda" className="text-white hover:text-primary duration-150">Pre-Agendado</Link>
              </li>
              <li>
                <button onClick={() => setIsModalOpen(true)} className="text-white hover:text-primary duration-150">
                  Sair do sistema
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
          <h2 className="text-black text-2xl font-semibold mb-4">
                Realmente deseja sair?
            </h2>
            <div className="flex justify-between mt-4">
              <button onClick={confirmLogout} className="bg-gray-500 hover:bg-black text-white py-2 px-4 rounded-lg">Sim</button>
              <button onClick={() => setIsModalOpen(false)} className="bg-black hover:bg-primary py-2 px-4 rounded-lg text-white">Não</button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}

export default NavBar;