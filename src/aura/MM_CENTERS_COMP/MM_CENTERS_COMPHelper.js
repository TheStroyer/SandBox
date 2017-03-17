({
	
    doInit : function(component, event, helper) {
		if(!JSON.parse(JSON.stringify(component.get("v.carrinhoWrapper"))) ){
            this.criacarrinho(component, event, helper);
        }

       	else {
            var carrinho = JSON.parse(JSON.stringify(component.get("v.carrinhoWrapper")));
            carrinho = CarrinhoLib.calcularCarrinho(carrinho);
            component.set('v.carrinhoWrapper', carrinho);
            this.fillOFertas(component,event);
        }
        
	},

    changeOfertaSelecionada : function(component, event,ofertaId) {
        
        var carrinho = JSON.parse(JSON.stringify(component.get("v.carrinhoWrapper")));
        var ofertaSelecionada;
        var listaDeOfertas = JSON.parse(JSON.stringify(component.get('v.lstOfertasPorUF')));

        listaDeOfertas.forEach(estado=>{

            estado.ofertas.forEach(oferta=>{

                if(oferta.key === ofertaId) {

                    component.set("v.ofertaSelecionada", oferta);
                    component.set("v.svasDaOfertaSelecionada", oferta.svas);
                    ofertaSelecionada = oferta;
                    component.set("v.nomeDoPlano", (oferta.minutos + ' ' + oferta.dados));
                    component.set("v.DDD",oferta.DDD);
                    component.set("v.UF",estado.estado);
                }    
            });
        });
        
    },

    loadSvas : function(component, event, ufs) {

        var carrinho = JSON.parse(JSON.stringify(component.get("v.carrinhoWrapper")));

        var actGetSvas = component.get('c.getSVAs');
        actGetSvas.setParams({"pCatalogItemId":carrinho.catalogItemId,"pUFs":ufs});
        
        actGetSvas.setCallback(this,function(response) {
          var state = response.getState();
            if(state === "SUCCESS") {

                component.set("v.isvas",response.getReturnValue());

                this.fillListOfOfertas(component,event);
            }
            else if(state ==="ERROR") {

                var errors = response.getError();
                if(errors){
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " +
                                 errors[0].message);
                    }
                } else {
                    console.log("Erro não identificado");
                }    
            }
        });
        $A.enqueueAction(actGetSvas);  
    }, 
    
    criacarrinho: function(component, event, helper){            
        
        var action = component.get("c.getCriaCarrinho");                 
        
        action.setCallback(this, function(response) {
        	var state = response.getState();
            if (state === "SUCCESS") {
                component.set('v.carrinhoWrapper', response.getReturnValue());
                var carrinho = JSON.parse(JSON.stringify(component.get("v.carrinhoWrapper")));
                carrinho = CarrinhoLib.calcularCarrinho(carrinho);
                component.set('v.carrinhoWrapper', carrinho);
                this.fillOFertas(component,event);
                
            } 

        });    
        
        
        $A.enqueueAction(action);

    },
    
    fillOFertas : function(component, event) {

        var mapOfertas = {};
        var carrinho = JSON.parse(JSON.stringify(component.get("v.carrinhoWrapper")));

        carrinho.lstOfertaWrapper.forEach(item=>{
            var listaOfertasDoMapa = [];
            if(!mapOfertas[item.produto.UF__c]){
                listaOfertasDoMapa.push(item);
                mapOfertas[item.produto.UF__c] = listaOfertasDoMapa;
            }else if(mapOfertas[item.produto.UF__c].length > 0){
                listaOfertasDoMapa = mapOfertas[item.produto.UF__c];
                listaOfertasDoMapa.push(item);
            }else{
                listaOfertasDoMapa.push(item);
            }
            mapOfertas[item.produto.UF__c] = listaOfertasDoMapa;
        });

        component.set('v.mapOfertaToUf', mapOfertas);
		this.getUfs(component,event,mapOfertas)
    },

    getUfs : function(component, event, mapaDeOfertas) {

        var keys = [];
        for(var key in mapaDeOfertas){
            keys.push(key);
        }
        this.loadSvas(component, event, keys);
    },
    
    fillListOfOfertas : function(component, event){

        var listaDeOfertas = [];
        var mapaDeOfertas = JSON.parse(JSON.stringify(component.get('v.mapOfertaToUf')));

        for(var key in mapaDeOfertas){ 
            var ofertasPorEstado = {};
            if(mapaDeOfertas.hasOwnProperty(key)){
            	ofertasPorEstado['estado'] = key;
                ofertasPorEstado['ofertas'] = [];

                var ofertas = mapaDeOfertas[key];
                ofertas.forEach(oferta=>{
                	ofertasPorEstado.ofertas.push(this.OfertaToOfertaWrapper(oferta,component));        
                });
            listaDeOfertas.push(ofertasPorEstado);	
            }
            
        }

        component.set('v.lstOfertasPorUF', listaDeOfertas);
        this.changeOfertaSelecionada(component, event, listaDeOfertas[0].ofertas[0].key);
        this.loadFinish();
    },
    OfertaToOfertaWrapper: function (oferta,component){
    	var ofertaWrapper = {};

        ofertaWrapper['UF'] = oferta.produto.UF__c;
        ofertaWrapper['DDD'] = oferta.produto.DDD__c;
        ofertaWrapper['minutos'] = oferta.minutos.NE__Value__c;
        ofertaWrapper['dados'] = oferta.dados.NE__Value__c;
        ofertaWrapper['qtd'] = oferta.quantidade;
        ofertaWrapper['key'] = oferta.key;
        ofertaWrapper['valorTotal'] = oferta.TotalPlano;
        ofertaWrapper['valorLinha'] = (oferta.quantidade>0)?(oferta.TotalPlano/oferta.quantidade):0;
        ofertaWrapper['svas'] = [];

        var lstSvas = JSON.parse(JSON.stringify(component.get('v.isvas')));

        lstSvas.forEach((sva,s)=>{

            var item = {};
            item['name'] = sva.productName;
            item['produto'] = sva.produto;
            item['atributos'] = [];
            item['valorTotal'] = 0;
            sva.matriz.forEach((att,a)=>{

                if(att.Estado__c === oferta.produto.UF__c){

                    var atributo = {};

                    atributo = att;
                    atributo['qtd']=0;

                    oferta.lstAtributosWrapper.forEach((svaDaOferta,i)=>{

                        if(item.name.toLowerCase() === svaDaOferta.produtoAdicional.NE__ProdName__c.toLowerCase()){

                            svaDaOferta.atributo.NE__Value__c.split(';').forEach((value,j)=>{

                                if(value.toLowerCase()===atributo.Produto_Adicional__r.Name.toLowerCase()){

                                    atributo['qtd'] = atributo.qtd? parseInt(atributo.qtd)+1: 1;

                                    return; 
                                }
                            });
                            return;
                        }
                    });
                    item.atributos.push(atributo);

                    return;
                }
            }); 
            ofertaWrapper.svas.push(item);
   
        })

        return ofertaWrapper;
    },
    
    verificaItens : function(component,event, svaId){
        var ofertaSelecionada = JSON.parse(JSON.stringify(component.get('v.ofertaSelecionada')));

        var sva = {}
        var svaIndex;
        var somaDosInputs = 0;
        ofertaSelecionada.svas.forEach((item,j)=>{
            if(item.produto.Id===svaId){
                sva = item;
                svaIndex = j;
            }
        });
        if(!this.podeInserirSva(component,event,ofertaSelecionada)){
            return;
        }
        if(svaId){
            var concatValue = "";
            var inputs = document.querySelectorAll("input[data-parentid='"+ svaId +"']");
            inputs.forEach((input,k)=>{

                if(input.value>=0){
                    somaDosInputs += input.value;
                    var name = input.getAttribute('data-attname');
                    for(var i = 0; i<input.value;i++){
                        concatValue = concatValue.concat((name+';'));    
                    }
                    sva.atributos.forEach((att,i)=>{

                        if(att.Produto_Adicional__r.Name===name){

                            att.qtd = input.value;

                            sva.atributos[i]=att;
                            sva.valorTotal += (att.qtd * att.Preco__c);

                        }

                    });
                }
            });

            ofertaSelecionada.svas[svaIndex]=sva;
            if(somaDosInputs>0){
                this.upsertSva(ofertaSelecionada,sva,concatValue,component);
            }
            else{
                this.removeSva(ofertaSelecionada,sva,null,component);
            }
            
            var listaDeOfertas = JSON.parse(JSON.stringify(component.get('v.lstOfertasPorUF')));
            listaDeOfertas.forEach((estado,e)=>{

                estado.ofertas.forEach((oferta,o)=>{

                    if(oferta.key === ofertaSelecionada.key){

                        oferta = ofertaSelecionada;
                        estado.ofertas[o]=oferta;    
                    }

                });
                listaDeOfertas[e]=estado;
            });
            component.set('v.lstOfertasPorUF',listaDeOfertas);
            this.changeOfertaSelecionada(component, event, ofertaSelecionada.key);
        }      
    },

    podeInserirSva : function(component,event,oferta){

        var count = 1;

        oferta.svas.forEach(item=>{

            if(item.valorTotal>0){

                count++;

            }
        });
        if(count>4){
            alert('Não é permitido a inclusão de mais de 4 SVAs por oferta.');
            return false;
        }
        return true;
    },

    upsertSva : function(ofertaSelecionada,sva,value,component){

        var atributoWrapper = this.criaAtributoWrapper(sva,value);
        var carrinho = JSON.parse(JSON.stringify(component.get("v.carrinhoWrapper")));        
        carrinho = CarrinhoLib.upsertSVA(atributoWrapper,ofertaSelecionada,carrinho);

        component.set("v.carrinhoWrapper",carrinho);
    },

    removeSva : function(ofertaSelecionada,sva,value, component){

        var atributoWrapper = this.criaAtributoWrapper(sva,value);
        var carrinho = JSON.parse(JSON.stringify(component.get("v.carrinhoWrapper")));        
        carrinho = CarrinhoLib.removerSVA(atributoWrapper,ofertaSelecionada,carrinho);

        component.set("v.carrinhoWrapper",carrinho);    
    },

    criaAtributoWrapper : function(sva,value){

        var wrapper = {};
        wrapper['atributo'];
        wrapper['produtoAdicional'];
        var produtoAdicional = {};
        produtoAdicional['NE__ProdName__c'] = sva.name;

        produtoAdicional['NE__CatalogItem__c'] = sva.produto.Id;
        produtoAdicional['NE__Qty__c'] = 1;
        produtoAdicional['NE__BaseRecurringCharge__c']= sva.valorTotal;
        wrapper.produtoAdicional = produtoAdicional;
        var atributo = {};
        atributo['Name'] = sva.name;
        atributo['NE__Value__c'] = value;
        wrapper.atributo= atributo;

        return  wrapper;


    }, 

    loadFinish : function(){

        $("#next").attr("disabled",false);
    }                
                    
})