# 🔌 Integração com APIs

## Como Integrar Dados Reais

### Opção 1: Fetch com Endpoint

```javascript
async function loadDataFromAPI() {
  try {
    const response = await fetch('/api/techstore/dashboard');
    const data = await response.json();
    
    if (validateData(data)) {
      Object.assign(window.data, data);
      destroyCharts();
      initCharts();
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

// Chamar ao carregar
document.addEventListener('DOMContentLoaded', loadDataFromAPI);
```

### Opção 2: Atualização Periódica

```javascript
function setupAutoRefresh(interval = 60000) {
  setInterval(async () => {
    try {
      const response = await fetch('/api/techstore/dashboard');
      const data = await response.json();
      
      if (validateData(data)) {
        Object.assign(window.data, data);
        destroyCharts();
        initCharts();
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  }, interval);
}

// Atualizar a cada 1 minuto
setupAutoRefresh(60000);
```

### Opção 3: WebSocket para Tempo Real

```javascript
function setupRealtime() {
  const ws = new WebSocket('wss://api.example.com/dashboard');
  
  ws.onopen = () => console.log('Conectado');
  
  ws.onmessage = (event) => {
    const newData = JSON.parse(event.data);
    
    if (validateData(newData)) {
      Object.assign(window.data, newData);
      destroyCharts();
      initCharts();
      updateKPIs(currentPeriod);
    }
  };
  
  ws.onerror = (error) => console.error('Erro:', error);
}

setupRealtime();
```

## Estrutura Esperada da API

```json
{
  "evolucao": [
    {
      "periodo": "2024-01",
      "receita": 6652462.45,
      "lucro": 1634283.46
    }
  ],
  "categoria": {
    "Notebooks": 48152623.34,
    "Smartphones": 35826883.16
  },
  "canal": {
    "Site": 44138161.58,
    "Marketplace": 29738625.17
  },
  "regiao": {
    "Sudeste": 57333429.46,
    "Sul": 22544193.14
  },
  "pagamento": {
    "Boleto": 25449653.32,
    "Transferência": 25365343.22
  },
  "produtos": [
    {
      "nome": "MacBook Air M2",
      "quantidade": 2523,
      "receita": 18019430.36
    }
  ],
  "vendedores": [
    {
      "nome": "Isabela Nunes",
      "receita": 10916121.27
    }
  ]
}
```

## Validação de Dados

```javascript
function validateData(data) {
  // Campos obrigatórios
  const required = ['evolucao', 'categoria', 'canal', 'regiao'];
  
  for (const field of required) {
    if (!data[field]) {
      console.error(`Campo faltando: ${field}`);
      return false;
    }
  }
  
  // Validar tipos
  if (!Array.isArray(data.evolucao)) return false;
  if (typeof data.categoria !== 'object') return false;
  
  // Validar valores
  if (data.evolucao.length === 0) return false;
  
  // Verificar períodos
  for (const item of data.evolucao) {
    if (!item.periodo || !item.receita || !item.lucro) return false;
    if (item.receita < 0 || item.lucro < 0) return false;
  }
  
  return true;
}
```

## Headers Recomendados

```
Content-Type: application/json; charset=utf-8
Access-Control-Allow-Origin: *
Cache-Control: public, max-age=300
Content-Encoding: gzip
ETag: "abc123"
```

---

Para mais detalhes, consulte o arquivo `index.html`
