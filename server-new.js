// create server connection

// const optionsfb = {
//     host: 'servidor',
//     port: 3050,
//     database: 'C:/delphus/delphus/BancosFB/Macropecas/DADOS.FDB',
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
    host: '187.44.93.73',
    port: 3050,
    database: 'C:/react/dados/DADOS2.FDB',
    user: 'SYSDBA',
    password: 'masterkey',
    lowercase_keys: false, // set to true to lowercase keys
    role: null,            // default
    pageSize: 16384       // default when creating database
}

let PDFDocument = require('pdfkit')
let app = require('express')()
let http = require('http').Server(app)
let cors = require('cors')
const fs = require('fs');
let Report = require('fluentReports').Report;
let port = process.env.PORT || 3001
let Firebird = require('node-firebird');
let CryptoJS = require('crypto-js');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');
var sread = require('stream').Readable;
var stream = sread();

var swrite = require('stream').Writable;
var wstream = swrite();





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

app.use(cors())

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
                    'trim(cast(PED.STATUS as char(1) character SET UTF8)) STATUS, trim(cast(PED.WEB as char(1) character SET UTF8)) WEB,'+
                    'PED.DESCONTO1, PED.DESCONTO2, PED.DESCONTO3 '+
                    'from PEDIDOS_VENDA PED '+
                    'join CLIENTES CLI on CLI.PK_CLI = PED.FK_CLI '+
                    'join COND_PAG CPG on CPG.PK_CPG = PED.FK_CPG '+
                    'WHERE PK_PED='+db.escape(ped);
            // console.log(sql)

            db.query(sql, function(err, result) {
                // IMPORTANT: close the connection
                let sql = 'select IPE.PK_IPE, IPE.FK_PED, IPE.FK_PRO, trim(cast(PRO.CODIGO_REPRESENTADA as varchar(20) character SET UTF8)) CODIGOPRO, trim(cast(NOME_MACROPECAS as varchar(100) character SET UTF8)) DESCRICAOPRO, IPE.QUANTIDADE, IPE.VALOR, IPE.DESCONTO1, IPE.DESCONTO2, IPE.DESCONTO3, '+
                    'trim(cast(IPE.OBSERVACAO as varchar(100) character SET UTF8)) OBSERVACAO, IPE.CONTROLE, IPE.IPI, IPE.PERC_STICMS, IPE.VALOR_STICMS, (IPE.QUANTIDADE*IPE.VALOR*(IPE.DESCONTO1/100)) as TOTAL '+
                    'from ITENS_PED_VENDA IPE '+
                    'join PRODUTOS PRO on PRO.PK_PRO = IPE.FK_PRO '+
                    'WHERE IPE.FK_PED='+db.escape(ped);
            // console.log(sql)
                pedido = result

                db.query(sql, async function(err, result) {
                    // IMPORTANT: close the connection
            
                    // console.log(result)
                    db.detach();

                    itepedido = result

                    primary_data = itepedido

                    var detail = function (x, r) {
                        x.band([
                            {data: r.CODIGOPRO, width: 240},
                            {data: r.DESCRICAOPRO, width: 60, align: 3},
                            {data: r.VALOR, width: 70, align: 3},
                            {data: r.QUANTIDADE, width: 90, align: 3}
                        ], {x: 30});
                    };

                    var productTypeHeader = function (x, r) {
            x.fontBold();
            x.band([
                {data: r.type, width: 240, fontBold: true}
            ], {x: 20});
            x.fontNormal();
        };

        var productTypeFooter = function (x, r) {
            x.fontBold();
            x.band([
                {data: r.type + ' Total:', width: 130, align: 3},
                {data: x.totals.amount, width: 90, align: 3}
            ], {x: 270});
            x.fontNormal();
        };

        var proposalHeader = function (x, r) {
            var fSize = 9;
            x.print(ped, {x: 40, y: 70, fontSize: fSize + 19, fontBold: true});
            x.print('THIS IS NOT AN INVOICE', {x: 40, y: 100, fontsize: fSize + 4, fontBold: true});
            x.print('Questions? Please call us.', {x: 40, y: 150, fontsize: fSize});
            x.band([{data: 'Proposal #:', width: 100}, {data: "12345", width: 100, align: "left", fontSize: 9}], {
                x: 400,
                y: 60
            });
            x.band([{data: 'Date Prepared:', width: 100}, {data: r.date, width: 100, fontSize: 9}], {x: 400});
            x.band([{data: 'Prepared By:', width: 100}, {data: "Jake Snow", width: 100, fontSize: 9}], {x: 400});
            x.band([{data: 'Prepared For:', width: 100}], {x: 400});
            x.fontSize(9);

            if (r.name) {
                x.band([{data: r.name, width: 150}], {x: 410});
            }
            if (r.address_1) {
                x.band([{data: r.address_1, width: 150}], {x: 410});
            }
            if (r.address_2) {
                x.band([{data: r.address_2, width: 150}], {x: 410});
            }
            if (r.city) {
                x.band([{data: r.city + ", " + r.state + " " + r.zip, width: 150}], {x: 410});
            }

            x.fontSize(8);
            x.print('This quote is good for 60 days from the date prepared. Product availability is subject to change without notice. Due to rapid changes in technology, ' +
            'and to help us keep our prices competitive, we request that you appropriate an additional 5-10% of the hardware shown on the proposal to compensate ' +
            'for possible price fluctuations between the date this proposal was prepared and the date you place your order.  Once a proposal has been approved and  ' +
            'hardware ordered, returned goods are subject to a 15% restocking fee.', {x: 40, y: 175, width: 540});
            x.newline();
            x.print('Any travel fees quoted on this proposal may be reduced to reflect actual travel expenses.', {x: 40});
            x.newline();
            x.fontSize(11);
            x.band([
                {data: 'Código', width: 250},
                {data: 'Descrição', width: 60, align: 3},
                {data: 'Preço', width: 70, align: 3},
                {data: 'Quantidade', width: 90, align: 3},
                // {data: 'Annual', width: 70, align: 3}
            ], {x: 0});
            x.bandLine(1);
        };

        var proposalFooter = function (x) {
            x.fontSize(7.5);
            x.print('To place an order for the goods and services provided by us, please either contact us to place your order or fax a copy ' +
            'of your PO to 999-555-1212', {x: 40, width: 570});
            x.print('Please call us if you have any other questions about how to order. Thank you for your business!', {
                x: 40,
                width: 570
            });
        };

        console.log(ped)
        if (!fs.existsSync('pedidos')){
            fs.mkdirSync('pedidos');
        }
        var report = new Report('pedidos/'+ped+'.pdf').data(primary_data);


        report.margins(20)
            .detail(detail);

        // See you can separate it; and chain however you need too
        report.groupBy("no")
            .header(proposalHeader)
            .footer(proposalFooter)
            .groupBy("product.product_type")
            .sum("amount")
            .header(productTypeHeader)
            .footer(productTypeFooter);

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


async function gerapdfdefault(name) {
    return new Promise (async (resolve)=>{


     // Run Sales Invoice
        /* globals Report, pipeStream, displayReport */
        primary_data = {
            data: 'teste'
        }
        

        var detail = function (x, r) {
            x.band([
                {data: r.description, width: 240},
                {data: r.qty, width: 60, align: 3},
                {data: r.price, width: 70, align: 3},
                {data: r.amount, width: 90, align: 3},
                {data: r.annual, width: 70, align: 3}
            ], {x: 30});
        };

        var productTypeHeader = function (x, r) {
            x.fontBold();
            x.band([
                {data: r.type, width: 240, fontBold: true}
            ], {x: 20});
            x.fontNormal();
        };

        var productTypeFooter = function (x, r) {
            x.fontBold();
            x.band([
                {data: r.type + ' Total:', width: 130, align: 3},
                {data: x.totals.amount, width: 90, align: 3}
            ], {x: 270});
            x.fontNormal();
        };

        var proposalHeader = function (x, r) {
            var fSize = 9;
            x.print(name, {x: 40, y: 70, fontSize: fSize + 19, fontBold: true});
            x.print('THIS IS NOT AN INVOICE', {x: 40, y: 100, fontsize: fSize + 4, fontBold: true});
            x.print('Questions? Please call us.', {x: 40, y: 150, fontsize: fSize});
            x.band([{data: 'Proposal #:', width: 100}, {data: "12345", width: 100, align: "left", fontSize: 9}], {
                x: 400,
                y: 60
            });
            x.band([{data: 'Date Prepared:', width: 100}, {data: r.date, width: 100, fontSize: 9}], {x: 400});
            x.band([{data: 'Prepared By:', width: 100}, {data: "Jake Snow", width: 100, fontSize: 9}], {x: 400});
            x.band([{data: 'Prepared For:', width: 100}], {x: 400});
            x.fontSize(9);

            if (r.name) {
                x.band([{data: r.name, width: 150}], {x: 410});
            }
            if (r.address_1) {
                x.band([{data: r.address_1, width: 150}], {x: 410});
            }
            if (r.address_2) {
                x.band([{data: r.address_2, width: 150}], {x: 410});
            }
            if (r.city) {
                x.band([{data: r.city + ", " + r.state + " " + r.zip, width: 150}], {x: 410});
            }

            x.fontSize(8);
            x.print('This quote is good for 60 days from the date prepared. Product availability is subject to change without notice. Due to rapid changes in technology, ' +
            'and to help us keep our prices competitive, we request that you appropriate an additional 5-10% of the hardware shown on the proposal to compensate ' +
            'for possible price fluctuations between the date this proposal was prepared and the date you place your order.  Once a proposal has been approved and  ' +
            'hardware ordered, returned goods are subject to a 15% restocking fee.', {x: 40, y: 175, width: 540});
            x.newline();
            x.print('Any travel fees quoted on this proposal may be reduced to reflect actual travel expenses.', {x: 40});
            x.newline();
            x.fontSize(11);
            x.band([
                {data: 'Description', width: 250},
                {data: 'Qty', width: 60, align: 3},
                {data: 'Price', width: 70, align: 3},
                {data: 'Ext. Price', width: 90, align: 3},
                {data: 'Annual', width: 70, align: 3}
            ], {x: 0});
            x.bandLine(1);
        };

        var proposalFooter = function (x) {
            x.fontSize(7.5);
            x.print('To place an order for the goods and services provided by us, please either contact us to place your order or fax a copy ' +
            'of your PO to 999-555-1212', {x: 40, width: 570});
            x.print('Please call us if you have any other questions about how to order. Thank you for your business!', {
                x: 40,
                width: 570
            });
        };

        console.log(name)
        if (!fs.existsSync('pedidos')){
            fs.mkdirSync('pedidos');
        }
        var report = new Report('pedidos/'+name+'.pdf').data(primary_data);


        report.margins(20)
            .detail(detail);

        // See you can separate it; and chain however you need too
        report.groupBy("no")
            .header(proposalHeader)
            .footer(proposalFooter)
            .groupBy("product.product_type")
            .sum("amount")
            .header(productTypeHeader)
            .footer(productTypeFooter);

        // Run the Report
        // displayReport is predefined to make it display in the browser
        console.log('Render')
        await report.render((err, name)=>{console.log(name);resolve(name)});
        
        
    })
}

function removeAcento (text)
{       
    text = text.toLowerCase();      
    text = text.replace(new RegExp('[~`´^¨]','gi'), '');                                          
    text = text.replace(new RegExp('[ÁÀÂÃ]','gi'), 'a');
    text = text.replace(new RegExp('[ÉÈÊ]','gi'), 'e');
    text = text.replace(new RegExp('[ÍÌÎ]','gi'), 'i');
    text = text.replace(new RegExp('[ÓÒÔÕ]','gi'), 'o');
    text = text.replace(new RegExp('[ÚÙÛ]','gi'), 'u');
    text = text.replace(new RegExp('[Ç]','gi'), 'c');
    text = text.toUpperCase();
    return text;                 
}

app.get('/api/gerapdf',  async function (req, res, next) {
    if (!isEmpty(req.query)) {
        await gerapdf(req.query.ped, req.query.user)
        fs.readFile('pedidos/'+req.query.ped+'.pdf', function (err,data){
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
            res.json(result); res.end();
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
            res.json(result); res.end();
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
            res.json(result); res.end();
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
            res.json(result); res.end();
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

//         let sql = 'select first 10000 PK_PRO, trim(cast(CODIGO_REPRESENTADA as varchar(20) character SET UTF8)) CODIGO_REPRESENTADA, trim(cast(NOME_REPRESENTADA as varchar(100) character SET UTF8)) NOME_REPRESENTADA, trim(cast(CLASSIFICACAO_FISCAL as varchar(10) character SET UTF8)) CLASSIFICACAO_FISCAL, '+
//         'trim(cast(CODIGO_BARRAS as varchar(20) character SET UTF8)) CODIGO_BARRAS, IPI, PRECO_VENDA_LISTA, PRECO_REGIAO_1, PRECO_REGIAO_2, PRECO_REGIAO_3, PRECO_REGIAO_4, '+
//         'PRECO_VENDA_PROMO, PRECO_PROM_REGIAO_1, PRECO_PROM_REGIAO_2, PRECO_PROM_REGIAO_3,PRECO_PROM_REGIAO_4, PERC_DESC_PROMO, '+ 
//         campoDate('DATA_VALID_PROMO')+', trim(cast(OBS_PROMOCIONAL as varchar(200) character SET UTF8)) OBS_PROMOCIONAL, '+campoDate('DATA_ATUALIZACAO_PRECOS')+' from PRODUTOS where ATIVO='+db.escape('S')+' order by NOME_REPRESENTADA, CODIGO_REPRESENTADA ';
        

//         db.query(sql, function(err, result) {
//             // IMPORTANT: close the connection
//             if (err)
//                 throw err;

//             db.detach();
//             res.json(result); res.end();
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
        


        let sql = isEmpty(req.query) ? 'select count(pk_pro) from produtos where ATIVO='+db.escape('S') :  'select first '+req.query.first+' skip '+req.query.skip+' PK_PRO, trim(cast(CODIGO_REPRESENTADA as varchar(20) character SET UTF8)) CODIGO_REPRESENTADA, trim(cast(NOME_REPRESENTADA as varchar(100) character SET UTF8)) NOME_REPRESENTADA, trim(cast(CLASSIFICACAO_FISCAL as varchar(10) character SET UTF8)) CLASSIFICACAO_FISCAL, '+
        'trim(cast(CODIGO_BARRAS as varchar(20) character SET UTF8)) CODIGO_BARRAS, IPI, PRECO_VENDA_LISTA, PRECO_REGIAO_1, PRECO_REGIAO_2, PRECO_REGIAO_3, PRECO_REGIAO_4, '+
        'PRECO_VENDA_PROMO, PRECO_PROM_REGIAO_1, PRECO_PROM_REGIAO_2, PRECO_PROM_REGIAO_3,PRECO_PROM_REGIAO_4, PERC_DESC_PROMO, '+ 
        campoDate('DATA_VALID_PROMO')+', trim(cast(OBS_PROMOCIONAL as varchar(200) character SET UTF8)) OBS_PROMOCIONAL, '+campoDate('DATA_ATUALIZACAO_PRECOS')+' from PRODUTOS where ATIVO='+db.escape('S')+' order by NOME_REPRESENTADA, CODIGO_REPRESENTADA ';
        


        db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
            if (err)
                throw err;

            db.detach();
            res.json(result); res.end();
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
            res.json(result); res.end();
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
                delete: [],
                steps: []
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
                sync.steps.push('Quantidade informada')
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
                sync.steps.push(req.query.type+' adicionado')
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
                    resolve(err)
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
            console.log(removeAcento(decodeURIComponent(i)).split("''").join("'"))
            await transaction.query(removeAcento(decodeURIComponent(i)).split("''").join("'"), [],function(err, result) {
                count = count+1
                // console.log(i)
                if (err) {
                    console.log(err)
                    console.log('b')
                    transaction.rollback();
                    resolve(String(err))
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
                        await sendTransaction(sync.create, transaction).then((res)=>{
                            sync.steps.push('Create:')
                            sync.steps.push(res)
                        })
                        console.log('Created')
                        // .then(async (resolve) => {
                        await sendTransaction(sync.update, transaction).then((res)=>{
                            sync.steps.push('Update:')
                            sync.steps.push(res)
                        })
                        console.log('Updated')
                        // .then(async (resolve)=>{
                        await sendTransaction(sync.delete, transaction).then((res)=>{
                            sync.steps.push('Delete:')
                            sync.steps.push(res)
                        })
                        console.log('Deleted')
                        // .then(async (resolve)=>{
                        commitTransaction(transaction, db).then(async (resolve)=>{
                                        res.json(resolve)
                                        if (resolve === 'Commited!') {
                                            fs.unlinkSync('sync_log/sync_'+req.query.user+'_'+name+'.json',function(err){
                                                    if(err) return console.log(err);
                                                    console.log('file deleted successfully');
                                            });
                                        } else {
                                            arquivo = JSON.stringify(sync)
                                            fs.writeFileSync('sync_log/sync_'+req.query.user+'_'+name+'.json', arquivo, 'utf8');
                                        }
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
        let name = date.toISOString().substring(0, 10).split('-').join('');
        fs.readFile('sync_log/sync_'+req.query.user+'_'+name+'.json', 'utf8', (err, data) => {
            if (err) throw err;
            sync = JSON.parse(data)
            sync.steps.push(err)
            arquivo = JSON.stringify(sync)
            fs.writeFileSync('sync_log/sync_'+req.query.user+'_'+name+'.json', arquivo, 'utf8');
        })
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
//             res.json(result); res.end();
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
            res.json(result); res.end();
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
            res.json(result); res.end();
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
                res.json(result); res.end();
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
                    res.json(result); res.end();
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
                res.json(result); res.end();
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
                res.json(result); res.end();
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
                res.json(result); res.end();
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
                res.json(result); res.end();
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
            res.json(result); res.end();
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
            res.json(result); res.end();
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
            res.json(result); 
            res.end();
        });}
        else if  (req.params['user'].length == 14) {
            let sql = 'SELECT PK_VEN FROM VENDEDORES where CNPJ=' +db.escape(req.params['user'])+' and senha_web='+db.escape(req.params['password']);
            
            db.query(sql, function(err, result) {
            // IMPORTANT: close the connection
      
            console.log('cnpj') 
            console.log(result)           
            db.detach();
            res.json(result); 
            res.end();
        });
        } else {res.json([])
            res.end();
        db.detach();}
    });
    
    
   

})


// app.get('/api/user', function(req, res){
//     res.status(200).json({ vai: 'funcionou' })
// })


http.listen(port, function(){
    console.log('listening on *:' + port)
})
