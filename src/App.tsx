import { useState, useEffect } from 'react';
import type { FormEvent, ReactNode } from 'react'; /* <--- SEPARADO EM OUTRA LINHA */
import './App.css';

// --- Tipagem ---
type StatusType = 'preparando' | 'imprimindo' | 'revisando' | 'embalando' | 'entregue';

// Cores disponíveis
const CORES_DISPONIVEIS = [
  '#3b82f6', // Azul
  '#ef4444', // Vermelho
  '#f59e0b', // Laranja
  '#10b981', // Verde
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
];

const STATUS_ORDER: StatusType[] = ['preparando', 'imprimindo', 'revisando', 'embalando', 'entregue'];

interface Pedido {
  id: number;
  codigo: string;
  cliente: string;
  peca: string;
  status: StatusType;
  data: string;
  cor: string;
}

// Interfaces para Props
interface ScreenAdminProps {
  pedidos: Pedido[];
  onAdd: (pedido: Pedido) => void;
  onUpdate: (pedido: Pedido) => void;
  onDelete: (id: number) => void;
  onChangeStatus: (id: number, direcao: 'next' | 'prev') => void;
}

interface CardAdminProps {
  pedido: Pedido;
  onUpdate: (pedido: Pedido) => void;
  onDelete: (id: number) => void;
  onChangeStatus: (id: number, direcao: 'next' | 'prev') => void;
}

interface ColumnProps {
  title: string;
  count: number;
  color: string;
  children: ReactNode;
}

const SENHA_MESTRA = "skarlate13";

function App() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [telaAtual, setTelaAtual] = useState<'login' | 'admin' | 'rastreio'>('login');
  
  const [inputCodigo, setInputCodigo] = useState('');
  const [pedidosDoCliente, setPedidosDoCliente] = useState<Pedido[]>([]);
  const [erroLogin, setErroLogin] = useState('');

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('print_tracker_v3');
    if (dadosSalvos) setPedidos(JSON.parse(dadosSalvos));
  }, []);

  useEffect(() => {
    localStorage.setItem('print_tracker_v3', JSON.stringify(pedidos));
  }, [pedidos]);

  const handleEntrar = (e: FormEvent) => {
    e.preventDefault();
    setErroLogin('');

    if (inputCodigo === SENHA_MESTRA) {
      setTelaAtual('admin');
      setInputCodigo('');
      return;
    }

    const codigoBusca = inputCodigo.toUpperCase();
    const encontrados = pedidos.filter(p => p.codigo.toUpperCase() === codigoBusca);
    
    if (encontrados.length > 0) {
      setPedidosDoCliente(encontrados);
      setTelaAtual('rastreio');
      setInputCodigo('');
    } else {
      setErroLogin('Código não encontrado ou senha incorreta.');
    }
  };

  const sair = () => {
    setTelaAtual('login');
    setPedidosDoCliente([]);
    setErroLogin('');
    setInputCodigo('');
  };

  const adicionarPedido = (pedido: Pedido) => setPedidos(prev => [pedido, ...prev]);
  
  const atualizarPedido = (pedidoAtualizado: Pedido) => {
    setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
  };

  const deletarPedido = (id: number) => {
    if (confirm('Tem certeza que deseja apagar este item?')) {
      setPedidos(prev => prev.filter(p => p.id !== id));
    }
  };

  const mudarStatus = (id: number, direcao: 'next' | 'prev') => {
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p;
      const idxAtual = STATUS_ORDER.indexOf(p.status);
      let novoIdx = direcao === 'next' ? idxAtual + 1 : idxAtual - 1;
      if (novoIdx < 0) novoIdx = 0;
      if (novoIdx >= STATUS_ORDER.length) novoIdx = STATUS_ORDER.length - 1;
      return { ...p, status: STATUS_ORDER[novoIdx] };
    }));
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo-area" onClick={sair} style={{cursor: 'pointer'}}>
          <i className="ph-fill ph-cube-transparent icon-logo"></i>
          <h1>PrintTracker</h1>
        </div>
        {telaAtual !== 'login' && (
          <button onClick={sair} className="btn-sair">
            <i className="ph ph-sign-out"></i> Sair
          </button>
        )}
      </nav>

      {telaAtual === 'login' && (
        <div className="login-screen">
          <div className="login-box">
            <h2>Rastrear Encomenda</h2>
            <p>Digite o código hexadecimal recebido:</p>
            
            <form onSubmit={handleEntrar} className="login-form">
              <input 
                type="text" 
                placeholder="Ex: A1B2" 
                value={inputCodigo}
                onChange={e => setInputCodigo(e.target.value)}
                className="input-big"
                autoFocus
              />
              <button type="submit" className="btn-entrar">Acessar</button>
            </form>
            
            {erroLogin && <div className="error-msg">{erroLogin}</div>}
            
            <p className="hint">Administrador? Digite sua senha acima.</p>
          </div>
        </div>
      )}

      {telaAtual === 'rastreio' && <ScreenCliente listaPedidos={pedidosDoCliente} />}

      {telaAtual === 'admin' && (
        <ScreenAdmin 
          pedidos={pedidos} 
          onAdd={adicionarPedido} 
          onUpdate={atualizarPedido}
          onDelete={deletarPedido}
          onChangeStatus={mudarStatus}
        />
      )}
    </div>
  );
}

// --- CLIENTE VIEW ---
function ScreenCliente({ listaPedidos }: { listaPedidos: Pedido[] }) {
  const clienteNome = listaPedidos[0]?.cliente || 'Cliente';
  const codigo = listaPedidos[0]?.codigo || '---';

  return (
    <div className="client-view">
      <header className="client-header">
        <h2>Olá, {clienteNome}</h2>
        <span className="badge-codigo">Código: {codigo}</span>
      </header>
      <div className="lista-pedidos-cliente">
        {listaPedidos.map(pedido => <CardCliente key={pedido.id} pedido={pedido} />)}
      </div>
    </div>
  );
}

function CardCliente({ pedido }: { pedido: Pedido }) {
  const steps = [
    { id: 'preparando', label: 'Prep.', icon: 'ph-clipboard-text' },
    { id: 'imprimindo', label: 'Print', icon: 'ph-printer' },
    { id: 'revisando', label: 'Revisão', icon: 'ph-magnifying-glass' },
    { id: 'embalando', label: 'Emb.', icon: 'ph-package' },
    { id: 'entregue', label: 'Fim', icon: 'ph-check-fat' }
  ];
  const currentIdx = STATUS_ORDER.indexOf(pedido.status);
  const corCard = pedido.cor || '#3b82f6';

  return (
    <div className="tracker-card" style={{ borderLeft: `5px solid ${corCard}` }}>
      <div className="tracker-top">
        <span className="data-pedido">{pedido.data}</span>
        <h3 className="peca-destaque">{pedido.peca}</h3>
      </div>
      <div className="timeline">
        {steps.map((step, idx) => (
          <div key={step.id} className={`step ${idx <= currentIdx ? 'active' : ''}`}>
            <div 
              className="step-icon" 
              style={idx <= currentIdx ? { borderColor: corCard, background: idx === currentIdx ? corCard : 'transparent' } : {}}
            >
              <i className={`ph-fill ${step.icon}`}></i>
            </div>
            <span className="step-label">{step.label}</span>
            {idx < steps.length - 1 && (
              <div 
                className="step-line" 
                style={idx < currentIdx ? { background: corCard } : {}}
              ></div>
            )}
          </div>
        ))}
      </div>
      <div className="status-text-current">
        Status: <strong style={{ color: corCard }}>{pedido.status.toUpperCase()}</strong>
      </div>
    </div>
  );
}

// --- ADMIN VIEW ---
function ScreenAdmin({ pedidos, onAdd, onUpdate, onDelete, onChangeStatus }: ScreenAdminProps) {
  const [novoCliente, setNovoCliente] = useState('');
  const [novaPeca, setNovaPeca] = useState('');
  const [codigoCustom, setCodigoCustom] = useState(''); 
  const [corSelecionada, setCorSelecionada] = useState(CORES_DISPONIVEIS[0]);

  useEffect(() => { gerarNovoCodigo(); }, []);

  const gerarNovoCodigo = () => {
    setCodigoCustom(Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0'));
    setNovoCliente(''); 
  };

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!novoCliente || !novaPeca || !codigoCustom) return;

    const novoPedido: Pedido = {
      id: Date.now(),
      codigo: codigoCustom.toUpperCase(),
      cliente: novoCliente,
      peca: novaPeca,
      status: 'preparando',
      data: new Date().toLocaleDateString('pt-BR'),
      cor: corSelecionada
    };

    onAdd(novoPedido);
    setNovaPeca('');
  };

  const getCol = (type: 'fila' | 'prod' | 'fim') => {
    return pedidos.filter((p: Pedido) => {
      if (type === 'fila') return p.status === 'preparando';
      if (type === 'prod') return p.status === 'imprimindo' || p.status === 'revisando';
      if (type === 'fim') return p.status === 'embalando' || p.status === 'entregue';
      return false;
    });
  };

  return (
    <div className="admin-screen">
      <div className="admin-panel">
        <div className="panel-header">
          <h3><i className="ph ph-plus-circle"></i> Novo Pedido</h3>
          <button type="button" onClick={gerarNovoCodigo} className="btn-small">
            <i className="ph ph-arrows-clockwise"></i> Gerar Código
          </button>
        </div>
        
        <form onSubmit={handleAdd} className="add-form">
          <div className="input-group">
            <label>Código</label>
            <input className="input-dark code-input" value={codigoCustom} onChange={e => setCodigoCustom(e.target.value.toUpperCase())} />
          </div>
          <div className="input-group">
            <label>Cliente</label>
            <input className="input-dark" value={novoCliente} onChange={e => setNovoCliente(e.target.value)} placeholder="Nome..." />
          </div>
          <div className="input-group grow">
            <label>Peça</label>
            <input className="input-dark" value={novaPeca} onChange={e => setNovaPeca(e.target.value)} placeholder="Descrição..." />
          </div>
          
          <div className="input-group">
            <label>Cor da Tag</label>
            <div className="color-picker">
              {CORES_DISPONIVEIS.map(c => (
                <div 
                  key={c} 
                  className={`color-dot ${corSelecionada === c ? 'selected' : ''}`} 
                  style={{ background: c }}
                  onClick={() => setCorSelecionada(c)}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn-add">Adicionar</button>
        </form>
      </div>

      <div className="board">
        <Column title="Fila / Prep" count={getCol('fila').length} color="fila">
          {getCol('fila').map((p: Pedido) => (
            <CardAdmin key={p.id} pedido={p} onUpdate={onUpdate} onDelete={onDelete} onChangeStatus={onChangeStatus} />
          ))}
        </Column>
        <Column title="Produção" count={getCol('prod').length} color="processo">
          {getCol('prod').map((p: Pedido) => (
            <CardAdmin key={p.id} pedido={p} onUpdate={onUpdate} onDelete={onDelete} onChangeStatus={onChangeStatus} />
          ))}
        </Column>
        <Column title="Finalização" count={getCol('fim').length} color="concluido">
          {getCol('fim').map((p: Pedido) => (
            <CardAdmin key={p.id} pedido={p} onUpdate={onUpdate} onDelete={onDelete} onChangeStatus={onChangeStatus} />
          ))}
        </Column>
      </div>
    </div>
  );
}

// Componente auxiliar
function Column({ title, count, color, children }: ColumnProps) {
  return (
    <div className="column">
      <div className={`column-header ${color}`}>
        <h2>{title}</h2>
        <span className="count-badge">{count}</span>
      </div>
      <div className="card-list">{children}</div>
    </div>
  );
}

function CardAdmin({ pedido, onUpdate, onDelete, onChangeStatus }: CardAdminProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPeca, setEditPeca] = useState(pedido.peca);
  const [editCliente, setEditCliente] = useState(pedido.cliente);

  const salvarEdicao = () => {
    onUpdate({ ...pedido, peca: editPeca, cliente: editCliente });
    setIsEditing(false);
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(pedido.codigo);
  };

  const corCard = pedido.cor || '#3b82f6';

  return (
    <div className={`card ${isEditing ? 'editing' : ''}`} style={{ borderLeft: `4px solid ${corCard}` }}>
      <div className="card-top">
        <span className="hex-badge" onClick={copiarCodigo} title="Copiar">
          <i className="ph-bold ph-copy"></i> {pedido.codigo}
        </span>
        <span className="status-pill">{pedido.status}</span>
      </div>

      {isEditing ? (
        <div className="edit-area">
          <input className="input-edit" value={editPeca} onChange={e => setEditPeca(e.target.value)} />
          <input className="input-edit" value={editCliente} onChange={e => setEditCliente(e.target.value)} />
          <div className="edit-actions">
            <button onClick={salvarEdicao} className="btn-small save"><i className="ph-bold ph-check"></i></button>
            <button onClick={() => setIsEditing(false)} className="btn-small cancel"><i className="ph-bold ph-x"></i></button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="peca-title">{pedido.peca}</h3>
          <p className="client-name">{pedido.cliente}</p>
        </>
      )}
      
      <div className="admin-actions">
        <button onClick={() => onChangeStatus(pedido.id, 'prev')} disabled={pedido.status === 'preparando'} className="btn-icon back">
          <i className="ph-bold ph-caret-left"></i>
        </button>
        <div className="center-actions">
          <button onClick={() => setIsEditing(true)} className="btn-icon edit"><i className="ph-bold ph-pencil-simple"></i></button>
          <button onClick={() => onDelete(pedido.id)} className="btn-icon delete"><i className="ph-bold ph-trash"></i></button>
        </div>
        <button onClick={() => onChangeStatus(pedido.id, 'next')} disabled={pedido.status === 'entregue'} className="btn-icon next">
          <i className="ph-bold ph-caret-right"></i>
        </button>
      </div>
    </div>
  );
}

export default App;