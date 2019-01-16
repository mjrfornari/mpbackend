// create server connection

// const optionsfb = {
//     host: 'servidor',
//     port: 3050,
//     database: 'C:/delphus/delphus/BancosFB/Projeto Macropecas Web/DADOS.FDB',
//     user: 'SYSDBA',
//     password: 'masterkey',
//     lowercase_keys: false, // set to true to lowercase keys
//     role: null,            // default
//     pageSize: 16384       // default when creating database
// }


// const optionsfb = {
//     host: '192.168.0.254',
//     port: 3050,
//     database: 'C:/react/dados/DADOS.FDB',
//     user: 'SYSDBA',
//     password: 'masterkey',
//     lowercase_keys: false, // set to true to lowercase keys
//     role: null,            // default
//     pageSize: 16384       // default when creating database
// }

const optionsfb = {
    host: '192.168.0.254',
    port: 3050,
    database: 'C:/Delphus/dados/DADOS2.fdb',
    user: 'SYSDBA',
    password: 'masterkey',
    lowercase_keys: false, // set to true to lowercase keys
    role: null,            // default
    pageSize: 16384       // default when creating database
}

// const optionsfb = {
//     host: '187.44.93.73',
//     port: 3050,
//     database: 'C:/react/dados/DADOS.FDB',
//     user: 'SYSDBA',
//     password: 'masterkey',
//     lowercase_keys: false, // set to true to lowercase keys
//     role: null,            // default
//     pageSize: 16384       // default when creating database
// }

let app = require('express')()
let http = require('http').Server(app)
// let cors = require('cors')
const fs = require('fs');
let port = process.env.PORT || 8080
let Firebird = require('node-firebird');
let Report = require('fluentReports').Report;
let CryptoJS = require('crypto-js');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));


function dataISOtoDefault(data) {
    let day, month, year = ''
    year = data.substr(0,4)
    month = data.substr(5,2)
    day = data.substr(8,2)
    return (day+'/'+month+'/'+year)
}







function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}



var whitelist = ['https://192.168.0.254', 'http://localhost:3000']
var corsOptions = {
  origin: 'https://macropecasweb.sytes.net',
  optionsSuccessStatus: 200
}


async function gerapdf(ped, user) {
    return new Promise (async (resolve)=>{
        let itepedido = []
        let pedido = []
        Firebird.attach(optionsfb, function(err, db) {
            if (err)
                throw err;                        

            let sql = 'select PED.PK_PED, PED.NRO_MACROPECAS, PED.NUMWEB, PED.FK_CLI, PED.FK_REP, PED.VALOR_IPI, PED.VALOR_ST, CLI.RAZAO_SOCIAL, PED.FK_CPG, CPG.NOME NOMECPG, '+
                    'PED.DATA, PED.VALOR_CALCULADO, PED.VALOR_INFORMADO, trim(cast(PED.OBSERVACAO as varchar(5000) character SET UTF8)) OBSERVACAO, '+
                    'trim(cast(PED.ORCAMENTO as char(1) character SET UTF8)) ORCAMENTO, cast(PED.DATA_ENVIO as date) DATA_ENVIO, PED.NUMPED, PED.NUMORC, '+
                    'trim(cast(PED.ENVIADO as char(1) character SET UTF8)) ENVIADO, trim(cast(PED.IMPORTACAO as char(1) character SET UTF8)) IMPORTACAO,'+
                    'trim(cast(PED.STATUS as char(1) character SET UTF8)) STATUS, VEN.RAZAO_SOC VENDEDOR,trim(cast(PED.WEB as char(1) character SET UTF8)) WEB,'+
                    'PED.DESCONTO1, PED.DESCONTO2, PED.DESCONTO3 '+
                    'from PEDIDOS_VENDA PED '+
                    'join VENDEDORES VEN on VEN.PK_VEN = PED.FK_VEN '+
                    'join CLIENTES CLI on CLI.PK_CLI = PED.FK_CLI '+
                    'join COND_PAG CPG on CPG.PK_CPG = PED.FK_CPG '+
                    'WHERE PK_PED='+db.escape(ped);
            // console.log(sql)

            db.query(sql, function(err, result) {
                // IMPORTANT: close the connection
                let sql = 'select IPE.PK_IPE, IPE.FK_PED, IPE.FK_PRO, trim(cast(PRO.CODIGO_REPRESENTADA as varchar(20) character SET UTF8)) CODIGOPRO, trim(cast(NOME_MACROPECAS as varchar(100) character SET UTF8)) DESCRICAOPRO, IPE.QUANTIDADE, IPE.VALOR, IPE.DESCONTO1, IPE.DESCONTO2, IPE.DESCONTO3, '+
                    'trim(cast(IPE.OBSERVACAO as varchar(100) character SET UTF8)) OBSERVACAO, IPE.CONTROLE, IPE.IPI, IPE.PERC_STICMS, IPE.VALOR_STICMS, (IPE.QUANTIDADE*IPE.VALOR) as VALOR_TOTAL '+
                    'from ITENS_PED_VENDA IPE '+
                    'join PRODUTOS PRO on PRO.PK_PRO = IPE.FK_PRO '+
                    'WHERE IPE.FK_PED='+db.escape(ped);
            // console.log(sql)
                let pedido = result
                // console.log(pedido)

                db.query(sql, async function(err, result) {
                    // IMPORTANT: close the connection
            
                    // console.log(result)
                    db.detach();
                    
                    let itepedido = result
                    console.log(pedido)
                    itepedido.forEach((element, id) => {
                        element.VALOR_IPI = ((element.IPI || 0)/100)*element.VALOR*element.QUANTIDADE
                        element.VALORITENS = element.VALOR*element.QUANTIDADE
                    })
                    primary_data = itepedido

                    var detail = function (x, r) {
                        x.band([
                            {data: r.CODIGOPRO, width: 65, align: 1, fontSize: 9},
                            {data: r.DESCRICAOPRO, width: 230, align: 1, fontSize: 9},
                            {data: r.QUANTIDADE, width: 55, align: 3, fontSize: 9},
                            {data: (r.VALOR).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(",","*").replace(".",",").replace("*","."), width: 75, align: 3, fontSize: 9},
                            {data: (r.VALORITENS).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(",","*").replace(".",",").replace("*","."), width: 90, align: 3, fontSize: 9},
                            {data: (r.IPI || 0).toFixed(2).replace(",","*").replace(".",",").replace("*","."), width: 30, align: 3, fontSize: 9},
                            {data: (r.VALOR_IPI || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(",","*").replace(".",",").replace("*","."), width: 65, align: 3, fontSize: 9},
                            {data: (r.PERC_STICMS || 0).toFixed(2).replace(",","*").replace(".",",").replace("*","."), width: 30, align: 3, fontSize: 9},
                            {data: ((r.VALOR_STICMS || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(",","*").replace(".",",").replace("*","."), width: 65, align: 3, fontSize: 9}, 
                            {data: ((r.VALOR*r.QUANTIDADE)+(r.VALOR_STICMS || 0)+(r.VALOR_IPI || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(",","*").replace(".",",").replace("*","."), width: 90, align: 3, fontSize: 9},                        
                        ], {x: 30});
                    };


        var proposalHeader = function (x, r) {
            var fSize = 9;
            x.image('macropecasLogo.png', {width: 270, x: 50, y: 50});
            x.print('COMERCIAL MACROPEÇAS LTDA - CNPJ: 00.785.999/001-21', {x: 50, y: 120, width: 270, align: "center", fontSize: fSize});

            x.band([{data: pedido.ORCAMENTO==='S' ? 'Nº Orçamento:' : 'Nº Pedido:', width: 80}, {data: pedido[0].NUMWEB, width: 150, align: "right", fontSize: 9}], {
                x: 500,
                y: 68
            });
            x.band([{data: 'Data:', width: 80}, {data: dataISOtoDefault(pedido[0].DATA.toISOString()), width: 150,align: "right", fontSize: 9}], {x: 500});
            x.band([{data: 'Vendedor(a):', width: 80}, {data: pedido[0].VENDEDOR, width: 150,align: "right", fontSize: 9}], {x: 500});
            x.band([{data: 'Cliente:', width: 80}, {data: pedido[0].RAZAO_SOCIAL, width: 150,align: "right", fontSize: 9}], {x: 500});
            x.newline();
            x.newline();
            x.print( pedido.ORCAMENTO==='S' ? 'ORÇAMENTO DE VENDA' : 'PEDIDO DE VENDA', {align: "center", fontSize: fSize+12} )
            x.newline();
            x.newline();
            x.fontSize(11);
            x.band([
                {data: 'Código', width: 65, align: 1, fontSize: 9},
                {data: 'Descrição', width: 230, align: 1, fontSize: 9},
                {data: 'Quantidade', width: 55, align: 1, fontSize: 9},
                {data: 'Preço Unit.', width: 75, align: 1, fontSize: 9},
                {data: 'Valor Total', width: 90, align: 1, fontSize: 9},
                {data: '% IPI', width: 30, align: 1, fontSize: 9},
                {data: 'Valor IPI', width: 65, align: 1, fontSize: 9},
                {data: '% ST ICMS', width: 30, align: 1, fontSize: 9},
                {data: 'Valor ST ICMS', width: 65, align: 1, fontSize: 9},
                {data: 'Valor Total c/ Impostos', width: 90, align: 1, fontSize: 9},
                // {data: 'Annual', width: 70, align: 3}
            ], {x: 30});
            x.bandLine(1);
            x.newline();
            
        };

        var proposalFooter = function (x) {
            x.newline();
            x.fontBold();
            // x.print('Valor Total s/ Impostos:'+x.totals.VALOR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), { x:5,  width: 200, height: 10, align: 'center', fontSize: 9, fill: '#b5c6e0'});
            // x.print('Valor Total IPI:'+x.totals.VALOR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), { x:210,  width: 200, height: 10, align: 'center', fontSize: 9, fill: '#b5c6e0'});
            // x.print('Valor Total ST_ICMS:'+x.totals.VALOR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), { x:415,  width: 200, height: 10, align: 'center', fontSize: 9, fill: '#b5c6e0'});
            // x.print('Valor Total c/ Impostos:'+x.totals.VALOR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), { x:620,  width: 200, height: 10, align: 'center', fontSize: 9, fill: '#b5c6e0'});
            // x.print('Totais:', { x:20,  width: 795, height: 10, align: 'center', fontSize: 9, fill: '#b5c6e0'});
            x.band([
                {data: 'TOTAIS', width: 560, align: 'center', fontSize: 11},
            ], {x: 147, fill: '#b5c6e0'});
            x.band([
                {data: 'Produtos: '+x.totals.VALORITENS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(",","*").replace(".",",").replace("*","."), width: 140, align: 'center', fontSize: 9},
                {data: 'IPI: '+x.totals.VALOR_IPI.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(",","*").replace(".",",").replace("*","."), width: 140, align: 'center', fontSize: 9},
                {data: 'ST ICMS: '+x.totals.VALOR_STICMS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(",","*").replace(".",",").replace("*","."), width: 140, align: 'center', fontSize: 9},
                {data: (pedido.ORCAMENTO==='S' ? 'Orçamento: ' : 'Pedido: ')+(x.totals.VALORITENS+x.totals.VALOR_IPI+x.totals.VALOR_STICMS).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(",","*").replace(".",",").replace("*","."), width: 140, align: 'center', fontSize: 9},
            ], {x: 147, fill: '#b5c6e0'});
            x.newline();
            
            x.fontNormal();
        };

        var endereco = function (x) {
            x.fontNormal();
            x.line(25, 570, 820, 570);
            x.print(['RUA GUTEMBERG, 151 - SALAS 903 A 907 - PORTO ALEGRE - RS - CEP: 91310-010 - TEL: (51) 3083-0300 - (51) 0800-722-2222 - EMAIL: MACROPECAS@MACROPECAS.COM.BR'], { fontSize: 7, y: 580, width: 800, x: 25, align: 'center'});
        };

        console.log(ped)
        if (!fs.existsSync('pedidos')){
            fs.mkdirSync('pedidos');
        }
        var report = new Report('pedidos/'+ped+'.pdf', {landscape: true, paper: 'A4'}).data(primary_data);


        report.margins(-5)
            .detail(detail);

        // See you can separate it; and chain however you need too
        report.groupBy("no")
            .header(proposalHeader)
            .groupBy("product.product_type")
            .sum("VALOR_IPI")
            .sum("VALOR_STICMS")
            .sum("VALORITENS")
            .footer(proposalFooter)
            .pageFooter(endereco)

        // Run the Report
        // displayReport is predefined to make it display in the browser
        console.log('Render')
        await report.render((err, name)=>{console.log(name);resolve(name)});

                });
        
                // console.log(result)

                
            });

        });


        
    })
}


app.get('/api/gerapdf',  async function (req, res, next) {
    if (!isEmpty(req.query)) {
        await gerapdf(req.query.ped, req.query.user)
        fs.readFile('pedidos/'+req.query.ped+'.pdf', function (err,data){
            // res.contentType("application/pdf");
            // res.send(data);
            res.download('pedidos/'+req.query.ped+'.pdf', req.query.ped+'.pdf', function(err){
                if (err){
                    console.log(err)
                } else {
                    fs.unlinkSync('pedidos/'+req.query.ped+'.pdf')
                }
            })
        });
    }
    
})

app.get('/api/clientes/:user',  function (req, res, next) {

    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        db.query('SELECT pk_cli, trim(cast(nome_fantasia as varchar(50) character SET UTF8)) NOME_FANTASIA,'+ 
        'trim(cast(razao_social as varchar(50) character SET UTF8)) razao_social, trim(cast(cnpj as varchar(14) character SET UTF8)) cnpj,'+
        'trim(cast(fone1 as varchar(20) character SET UTF8)) fone1, trim(cast(INSCRICAO_ESTADUAL as varchar(20) character SET UTF8)) INSCRICAO_ESTADUAL, trim(cast(INSCRICAO_MUNICIPAL as varchar(20) character SET UTF8)) INSCRICAO_MUNICIPAL, '+
        'trim(cast(SUFRAMA as varchar(20) character SET UTF8)) SUFRAMA, trim(cast(ENDERECO as varchar(100) character SET UTF8)) ENDERECO, trim(cast(NUMERO as varchar(20) character SET UTF8)) NUMERO, '+
        'trim(cast(BAIRRO as varchar(50) character SET UTF8)) BAIRRO, trim(cast(CEP as char(8) character SET UTF8)) CEP, trim(cast(COMPLEMENTO as varchar(20) character SET UTF8)) COMPLEMENTO, '+
        'FK_CID, DDD1, DDD2,'+campoVarChar('SIMPLESNACIONAL', 1)+', trim(cast(FONE2 as varchar(20) character SET UTF8)) FONE2, trim(cast(EMAIL as varchar(40) character SET UTF8)) EMAIL, trim(cast(EMAIL_FINANCEIRO as varchar(100) character SET UTF8)) EMAIL_FINANCEIRO '+
        'FROM clientes WHERE FK_VEN='+db.escape(req.params['user'])+' or FK_VEN2='+db.escape(req.params['user'])+ ' order by RAZAO_SOCIAL', function(err, result) {
            // IMPORTANT: close the connection
      
            
            db.detach();
            res.json(result)
        });

    });
})

app.get('/api/descontolog',  function (req, res, next) {

    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        db.query('select pk_des, mes, ano, '+campoDate('data_limite')+', desconto '
        +'from desconto_logistico', function(err, result) {
            // IMPORTANT: close the connection
            
            db.detach();
            res.json(result)
        });

    });
})



app.get('/api/cidades',  function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        db.query('select cid.pk_cid, trim(cast(cid.nome as varchar(30) character SET UTF8)) NOMECIDADE, cid.FK_EST, trim(cast(est.nome as varchar(30) character SET UTF8)) NOMEESTADO, trim(cast(est.sigla as varchar(2) character SET UTF8)) UF from cidade cid '
        +'left join estado est on cid.fk_est = est.pk_est', function(err, result) {
            // IMPORTANT: close the connection
      
            
            db.detach();
            res.json(result)
        });

    });
})


app.get('/api/pedidos/:user',  function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        let sql = 'select PED.PK_PED, PED.NRO_MACROPECAS, PED.NUMWEB, PED.FK_CLI, PED.FK_REP, PED.VALOR_IPI, PED.VALOR_ST, CLI.RAZAO_SOCIAL, PED.FK_CPG, CPG.NOME NOMECPG, '+
                'PED.DATA, PED.VALOR_CALCULADO, PED.VALOR_INFORMADO, trim(cast(PED.OBSERVACAO as varchar(5000) character SET UTF8)) OBSERVACAO, '+
                'trim(cast(PED.ORCAMENTO as char(1) character SET UTF8)) ORCAMENTO, cast(PED.DATA_ENVIO as date) DATA_ENVIO, PED.NUMPED, PED.NUMORC, '+
                'trim(cast(PED.ENVIADO as char(1) character SET UTF8)) ENVIADO, trim(cast(PED.IMPORTACAO as char(1) character SET UTF8)) IMPORTACAO,'+
                'trim(cast(PED.STATUS as char(1) character SET UTF8)) STATUS, trim(cast(PED.WEB as char(1) character SET UTF8)) WEB,'+
                'PED.DESCONTO1, PED.DESCONTO2, PED.DESCONTO3 '+
                'from PEDIDOS_VENDA PED '+
                'join CLIENTES CLI on CLI.PK_CLI = PED.FK_CLI '+
                'join COND_PAG CPG on CPG.PK_CPG = PED.FK_CPG '+
                'WHERE PED.FK_VEN='+db.escape(req.params['user'])+' AND DATA>'+db.escape('2018-10-29');
        // console.log(sql)

        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            // console.log(result)
            db.detach();
            res.json(result)
        });

    });
})



function campoVarChar (campo, tamanho){
    let x ='trim(cast('+campo+' as varchar('+tamanho+') character SET UTF8)) '+campo
    return x
}

function campoDate (campo){
    let x ='cast('+campo+' as date) '+campo
    return x
}

// app.get('/api/produtos',  function (req, res, next) {
    
//     Firebird.attach(optionsfb, function(err, db) {
//         if (err)
//             throw err;                        

//         let sql = 'select first 10000 PK_PRO, trim(cast(CODIGO_REPRESENTADA as varchar(20) character SET UTF8)) CODIGO_REPRESENTADA, trim(cast(NOME_MACROPECAS as varchar(100) character SET UTF8)) NOME_REPRESENTADA, trim(cast(CLASSIFICACAO_FISCAL as varchar(10) character SET UTF8)) CLASSIFICACAO_FISCAL, '+
//         'trim(cast(CODIGO_BARRAS as varchar(20) character SET UTF8)) CODIGO_BARRAS, IPI, PRECO_VENDA_LISTA, PRECO_REGIAO_1, PRECO_REGIAO_2, PRECO_REGIAO_3, PRECO_REGIAO_4, '+
//         'PRECO_VENDA_PROMO, PRECO_PROM_REGIAO_1, PRECO_PROM_REGIAO_2, PRECO_PROM_REGIAO_3,PRECO_PROM_REGIAO_4, PERC_DESC_PROMO, '+ 
//         campoDate('DATA_VALID_PROMO')+', trim(cast(OBS_PROMOCIONAL as varchar(200) character SET UTF8)) OBS_PROMOCIONAL, '+campoDate('DATA_ATUALIZACAO_PRECOS')+' from PRODUTOS where ATIVO='+db.escape('S')+' order by NOME_REPRESENTADA, CODIGO_REPRESENTADA ';
        

//         db.query(sql, function(err, result) {
//             // IMPORTANT: close the connection
//             if (err)
//                 throw err;

//             db.detach();
//             res.json(result)
//         });

//     });
// })

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

app.get('/api/produtos',  function (req, res, next) {
    // console.log(req.query)
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;             
        


        let sql = isEmpty(req.query) ? 'select count(pk_pro) from produtos where ATIVO='+db.escape('S') :  'select first '+req.query.first+' skip '+req.query.skip+' PK_PRO, trim(cast(CODIGO_REPRESENTADA as varchar(20) character SET UTF8)) CODIGO_REPRESENTADA, trim(cast(NOME_MACROPECAS as varchar(100) character SET UTF8)) NOME_REPRESENTADA, trim(cast(CLASSIFICACAO_FISCAL as varchar(10) character SET UTF8)) CLASSIFICACAO_FISCAL, '+
        'trim(cast(CODIGO_BARRAS as varchar(20) character SET UTF8)) CODIGO_BARRAS, IPI, PRECO_VENDA_LISTA, PRECO_REGIAO_1, PRECO_REGIAO_2, PRECO_REGIAO_3, PRECO_REGIAO_4, '+
        'PRECO_VENDA_PROMO, PRECO_PROM_REGIAO_1, PRECO_PROM_REGIAO_2, PRECO_PROM_REGIAO_3,PRECO_PROM_REGIAO_4, PERC_DESC_PROMO, '+ 
        campoDate('DATA_VALID_PROMO')+', trim(cast(OBS_PROMOCIONAL as varchar(200) character SET UTF8)) OBS_PROMOCIONAL, '+campoDate('DATA_ATUALIZACAO_PRECOS')+' from PRODUTOS where ATIVO='+db.escape('S')+' order by NOME_REPRESENTADA, CODIGO_REPRESENTADA ';
        


        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
            if (err)
                throw err;

            db.detach();
            res.json(result)
        });

    });
})




app.get('/api/sticms',  function (req, res, next) {
    // console.log(req.query)
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;             
        


        let sql = isEmpty(req.query) ? 'select count(pk_sti) from ST_ICMS' :  'select first '+req.query.first+' skip '+req.query.skip+' PK_STI, '+campoVarChar('ORIGEM',2)+', FK_PRO, FK_ESTDESTINO, '+campoVarChar('SIMPLES_NACIONAL', 1)+', PERCENTUAL_ST, FK_ESTORIGEM from ST_ICMS';
        


        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
            if (err)
                throw err;

            db.detach();
            res.json(result)
        });

    });
})



app.get('/api/startSync',  function (req, res, next) {
    try {
        if (!isEmpty(req.query)) {
            date = new Date ()
            
            name = date.toISOString().substring(0, 10).split('-').join('');
            sync = {
                qty: {
                    create: 0,
                    update: 0,
                    delete: 0
                },
                create: [],
                update: [],
                delete: []
            }
            if (!fs.existsSync('sync_log')){
                fs.mkdirSync('sync_log');
            }
            arquivo = JSON.stringify(sync)
            fs.writeFileSync('sync_log/sync_'+req.query.user+'_'+name+'.json', arquivo, 'utf8');
            res.json('sync_'+req.query.user+'_'+name)
            console.log('Sync stared: '+'sync_'+req.query.user+'_'+name)
        } else {
            res.status(404).end();
        }
    } 
    catch (err) {
        res.status(404).end();
    }
})


app.get('/api/identifySync',  function (req, res, next) {
    try {
        if (!isEmpty(req.query)) {
            date = new Date ()
            name = date.toISOString().substring(0, 10).split('-').join('');
            fs.readFile('sync_log/sync_'+req.query.user+'_'+name+'.json', 'utf8', (err, data) => {
                if (err) throw err;
                sync = JSON.parse(data)
                sync.qty.create = req.query.create
                sync.qty.update = req.query.update
                sync.qty.delete = req.query.delete
                sync.create = []
                sync.update = []
                sync.delete = []
                arquivo = JSON.stringify(sync)
                res.json(sync.qty)
                fs.writeFileSync('sync_log/sync_'+req.query.user+'_'+name+'.json', arquivo, 'utf8');
            })
        } else {
            res.status(404).end();
        }
    } 
    catch (err) {
        res.status(404).end();
    }
})

app.get('/api/sendSQL',  function (req, res, next) {
    try {
        if (!isEmpty(req.query)) {
            date = new Date ()
            name = date.toISOString().substring(0, 10).split('-').join('');
            fs.readFile('sync_log/sync_'+req.query.user+'_'+name+'.json', 'utf8', (err, data) => {
                if (err) throw err;
                sync = JSON.parse(data)
                sync[req.query.type].push(req.query.sql)
                console.log(req.query.sql)
                arquivo = JSON.stringify(sync)
                res.json(sync)
                fs.writeFileSync('sync_log/sync_'+req.query.user+'_'+name+'.json', arquivo, 'utf8');
            })
        } else {
            res.status(404).end();
        }
    } 
    catch (err) {
        res.status(404).end();
    }
})


async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function commitTransaction(transaction, db){
    return new Promise (async (resolve) => {
        console.log('commit')
        transaction.commit(function(err) {
                if (err){
                    transaction.rollback();
                    db.detach();
                    resolve('Rollback executed')
                }
                else{
                    db.detach();
                    resolve('Commited!')
                }
                    
        });
        
    })

}



function sendTransaction(sync, transaction){
    return new Promise (async (resolve) => {
        let count = 0
        if (sync.length === 0){
            resolve('Done')
        }
        for(let i of sync){
            await transaction.query(i, [],function(err, result) {
                count = count+1
                console.log(i)
                if (err) {
                    console.log(err)
                    console.log('b')
                    transaction.rollback();
                } else {
                    
                    console.log('a')
                }
                console.log(count, sync.length, 'transaction')
                if (count === sync.length){
                    resolve('Done')
                }

            })
        }
        
    })
}


app.get('/api/startTransaction',  function (req, res, next) {
    try {
        if (!isEmpty(req.query)) {
            date = new Date ()
            name = date.toISOString().substring(0, 10).split('-').join('');
            fs.readFile('sync_log/sync_'+req.query.user+'_'+name+'.json', 'utf8', (err, data) => {
                if (err) throw err;
                sync = JSON.parse(data)

                if (Number(sync.qty.create) !== Number(sync.create.length)) throw "Create";
                if (Number(sync.qty.update) !== Number(sync.update.length)) throw "Update";
                if (Number(sync.qty.delete) !== Number(sync.delete.length)) throw "Delete";

                Firebird.attach(optionsfb, function(err, db) {
                    if (err)
                        throw err;                        
                    
                    
                    db.transaction(Firebird.ISOLATION_READ_UNCOMMITTED, async function(err, transaction) {
                        console.log(sync.create.length, sync.update.length, sync.delete.length)
                        await sendTransaction(sync.create, transaction)
                        console.log('Created')
                        // .then(async (resolve) => {
                        await sendTransaction(sync.update, transaction)
                        console.log('Update')
                        // .then(async (resolve)=>{
                        await sendTransaction(sync.delete, transaction)
                        console.log('Delete')
                        // .then(async (resolve)=>{
                        commitTransaction(transaction, db).then(async (resolve)=>{
                                        res.json(resolve)

                                        fs.unlinkSync('sync_log/sync_'+req.query.user+'_'+name+'.json',function(err){
                                                if(err) return console.log(err);
                                                console.log('file deleted successfully');
                                        });  
                                    })
                                // })
                            // })
                        // })
                    });

                });
                // fs.writeFileSync('sync_log/sync_'+req.query.user+'_'+name+'.json', arquivo, 'utf8');
            })
        } else {
            res.json('Rollback executed')
            // res.status(404).end();
        }
    } 
    catch (err) {
        console.log(err)
        res.json('Rollback executed')
        // res.status(404).end();
    }
})






// app.get('/api/sticms',  function (req, res, next) {
    
//     Firebird.attach(optionsfb, function(err, db) {
//         if (err)
//             throw err;                        

//         let sql = 'select PK_STI, '+campoVarChar('ORIGEM',2)+', FK_PRO, FK_ESTDESTINO, '+campoVarChar('SIMPLES_NACIONAL', 1)+', PERCENTUAL_ST, FK_ESTORIGEM from ST_ICMS where PK_STI=3'

//         db.query(sql, function(err, result) {
//             // IMPORTANT: close the connection
      
//             // console.log(result)
//             db.detach();
//             res.json(result)
//         });

//     });
// })




app.get('/api/itepedidos/:pedido',  function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        let sql = 'select IPE.PK_IPE, IPE.FK_PED, IPE.FK_PRO, trim(cast(PRO.CODIGO_REPRESENTADA as varchar(20) character SET UTF8)) CODIGOPRO, trim(cast(NOME_MACROPECAS as varchar(100) character SET UTF8)) DESCRICAOPRO, IPE.QUANTIDADE, IPE.VALOR, IPE.DESCONTO1, IPE.DESCONTO2, IPE.DESCONTO3, '+
                'trim(cast(IPE.OBSERVACAO as varchar(100) character SET UTF8)) OBSERVACAO, IPE.CONTROLE, IPE.IPI, IPE.PERC_STICMS, IPE.VALOR_STICMS, (IPE.QUANTIDADE*IPE.VALOR*(IPE.DESCONTO1/100)) as TOTAL '+
                'from ITENS_PED_VENDA IPE '+
                'join PRODUTOS PRO on PRO.PK_PRO = IPE.FK_PRO '+
                'WHERE IPE.FK_PED='+db.escape(req.params['pedido']);
        // console.log(sql)

        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            // console.log(result)
            db.detach();
            res.json(result)
        });

    });
})


app.get('/api/cpg',  function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;                        

        let sql = 'select CPG.PK_CPG, trim(cast(CPG.NOME as varchar(50) character SET UTF8)) NOME, CPG.DESCONTO, trim(cast(CPG.CODIGO_REPRESENTADA as varchar(50) character SET UTF8)) CODIGO_REPRESENTADA, '+
                ' trim(cast(CPG.BLOQ_FIN as char(1) character SET UTF8)) BLOQ_FIN, trim(cast(CPG.INATIVO as char(1) character SET UTF8)) INATIVO '+
                'from COND_PAG CPG where cpg.INATIVO <> '+db.escape('S');
        // console.log(sql)

        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            // console.log(result)
            db.detach();
            res.json(result)
        });

    });
})



app.get('/api/gerapk/:nomepk',  function (req, res, next) {
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        if (req.params['nomepk'] === 'NUMWEB') {
            db.query('select max(NUMWEB) valor from pedidos_venda', function(err, result) {
                // IMPORTANT: close the connection
                // console.log(result)
                res.json(result)
                db.detach();
            });            
        }
        else {
            db.query('update controle set valor=(valor+1) where campo = '+db.escape(req.params['nomepk']), function(err, result) {
                // IMPORTANT: close the connection
                // console.log(result)
                db.query('select valor from controle where campo = '+db.escape(req.params['nomepk']), function(err, result) {
                    // IMPORTANT: close the connection
                    // console.log(result)
                    res.json(result)
                    db.detach();
                });
                
            });
        }
    });
})


app.get('/api/criaitem/:table/:fields/:values',  function (req, res, next) {
    Firebird.attach(optionsfb, function(err, db) {
        let sql = 'INSERT INTO '+req.params['table']+' ('+req.params['fields'];
        sql = sql+') values ('+req.params['values']+')';
        console.log(sql)
        if (err)
            throw err;
        db.query(sql, function(err, result) {
                res.json(result)
                db.detach();
        });
            
    });
});


app.get('/api/deletaitem/:table/:pkname/:pk',  function (req, res, next) {
    Firebird.attach(optionsfb, function(err, db) {
        let limpaitens = 'DELETE FROM itens_ped_venda WHERE FK_PED=0'
        if (req.params['table'] === 'pedidos_venda') {
             limpaitens = 'DELETE FROM itens_ped_venda WHERE FK_PED='+req.params['pk'];
        }
        let sql = 'DELETE FROM '+req.params['table']+' WHERE '+req.params['pkname']+'='+req.params['pk'];
        console.log(sql)
        if (err)
            throw err;
        db.query(limpaitens, function(err, result) {
            db.query(sql, function(err, result) {
                res.json(result)
                db.detach();
            });
        });
            
    });
});

app.get('/api/atualizaitem/:table/:fieldsnvalues/:where',  function (req, res, next) {
    Firebird.attach(optionsfb, function(err, db) {
        let sql = 'UPDATE '+req.params['table']+' SET '+req.params['fieldsnvalues'];
        sql = sql+' WHERE '+req.params['where'];
        console.log(sql)
        if (err)
            throw err;
        db.query(sql, function(err, result) {
                res.json(result)
                db.detach();
        });
            
    });
});

app.get('/api/testquery',  function (req, res, next) {
    console.log(req.query.test)
    res.json(req.query.test)
})


app.get('/api/create/:command',  function (req, res, next) {
    console.log('entrou')
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
         db.query('update controle set valor=(valor+1) where campo = '+db.escape('PK_CLI'), function(err, result) {
            // IMPORTANT: close the connection
            console.log(result)
            db.query('select valor from controle where campo = '+db.escape('PK_CLI'), function(err, result) {
                // IMPORTANT: close the connection
                console.log(result)
                res.json(result)
                db.detach();
            });
            
        });
    });
})


app.get('/api/asdd',  function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        // db = DATABASE                         

        db.query('SELECT pk_cli, trim(cast(codigo_representada as varchar(20) character SET UTF8)) codigo_representada,'+ 
        'trim(cast(razao_social as varchar(50) character SET UTF8)) razao_social, trim(cast(cnpj as varchar(14) character SET UTF8)) cnpj,'+
        'trim(cast(fone1 as varchar(20) character SET UTF8)) fone1 '+
        'FROM clientes', function(err, result) {
            // IMPORTANT: close the connection
      
            
            db.detach();
            res.json(result)
        });

    });
})

app.get('/api/asd',  function (req, res, next) {
    
    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        // db = DATABASE                         

        db.query('SELECT pk_cli, trim(cast(codigo_representada as varchar(20) character SET UTF8)) codigo_representada,'+ 
        'trim(cast(razao_social as varchar(50) character SET UTF8)) razao_social, trim(cast(cnpj as varchar(14) character SET UTF8)) cnpj,'+
        'trim(cast(fone1 as varchar(20) character SET UTF8)) fone1 '+
        'FROM clientes', function(err, result) {
            // IMPORTANT: close the connection
      
            
            db.detach();
            res.json(result)
        });

    

    });

///////////////////////////////////////////////////////////
})



app.get('/api/login/:user/:password',  function (req, res, next) {
    
    // let crypto = CryptoJS.MD5(req.params['password'])
    // let senha = crypto.toString()
    // senha = senha.slice(0,20)

    Firebird.attach(optionsfb, function(err, db) {
        if (err)
            throw err;
        // db = DATABASE                         
        if  (req.params['user'].length == 11) {

            let sql = 'SELECT PK_VEN FROM VENDEDORES where CPF=' +db.escape(req.params['user'])+' and senha_web='+db.escape(req.params['password']);

            db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            console.log('cpf')
            console.log(result) 
            db.detach();
            res.json(result)
        });}
        else if  (req.params['user'].length == 14) {
            let sql = 'SELECT PK_VEN FROM VENDEDORES where CNPJ=' +db.escape(req.params['user'])+' and senha_web='+db.escape(req.params['password']);
            
            db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            console.log('cnpj') 
            console.log(result)           
            db.detach();
            res.json(result)
        });
        } else {res.json([])
        db.detach();}
    });
    
    
   

})


// app.get('/api/user', function(req, res){
//     res.status(200).json({ vai: 'funcionou' })
// })


http.listen(port, function(){
    console.log('listening on *:' + port)
})
