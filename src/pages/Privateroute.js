import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Estilos do toastify

function PrivateRoute({ role, children }) {
  const userRole = localStorage.getItem('role');
  const navigate = useNavigate();


  if (!localStorage.getItem('auth') || (role && !role.includes(userRole))) {
    toast.error('Você não tem permissão para acessar esta página.', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });

    navigate("/");  
    return null; 
  }

  return (
    <>
      <ToastContainer />
      {children} 
    </>
  );
}

export default PrivateRoute;
