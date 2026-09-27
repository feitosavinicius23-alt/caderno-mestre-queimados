/** Requisito 79: um erro de conteúdo nunca derruba a aplicação inteira. */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { erro: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  override componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('[caderno-mestre] Erro de renderização:', erro, info.componentStack);
  }

  override render() {
    if (this.state.erro) {
      return (
        <div className="cartao" role="alert" style={{ margin: 16 }}>
          <h2>Algo deu errado ao exibir este conteúdo</h2>
          <p className="suave">
            O restante da plataforma continua funcionando. Se o problema persistir, verifique o
            arquivo JSON da aula e rode <code className="mono">npm run validate-content</code>.
          </p>
          <pre className="mono" style={{ whiteSpace: 'pre-wrap', color: 'var(--vermelho-600)' }}>
            {this.state.erro.message}
          </pre>
          <button type="button" className="botao" onClick={() => this.setState({ erro: null })}>
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
