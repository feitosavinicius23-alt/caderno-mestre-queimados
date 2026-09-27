import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="vazio">
      <span className="vazio__icone" aria-hidden="true">🧭</span>
      <h1>Página não encontrada</h1>
      <p className="suave">O endereço acessado não existe nesta plataforma.</p>
      <Link className="botao" to="/">Voltar ao Dashboard</Link>
    </div>
  );
}
