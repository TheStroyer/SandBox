({
    changeVisibility : function(component, event, helper) {
       
    	var element = document.getElementById("message");
    	$A.util.toggleClass(element, "slds-hide");
        
    }, 
    
    ctrlInit:function(component, event, helper){
        helper.doInit(component, event, helper);
    },
    
   
    editsva:function(component, event, helper){
		var target = event.currentTarget;
		var ofertaId = $(target).attr("data-ofertaID");      
        helper.changeOfertaSelecionada(component, event, ofertaId);
    },
    
    changeValue : function(component, event, helper){
    	var target = event.currentTarget;
        var id = $(target).attr("data-myid");
        var operation = $(target).attr("data-key");
        //console.log('Operation --' + operation);
        helper.change(id, operation,component);
        
    },
    
    openShoppingCar : function(component, event, helper) {
        jQuery(".wrapperCarrinho").slideToggle(400);
        
        //jQuery(".estrutura").slideToggle(400);
        
        console.log('openShoppingCar');
        
        if ( jQuery(".iconDown").hasClass("ative") == true ){
            jQuery(".iconDown").css("display","none");
        	jQuery(".iconUp").css("display","block");
            jQuery(".iconDown").removeClass("ative");
        }else{
            jQuery(".iconDown").css("display","block");
        	jQuery(".iconUp").css("display","none");    
            jQuery(".iconDown").addClass("ative");
        }
    },

    aplicar : function(component, event, helper){
        var target = event.currentTarget;
        var svaId = $(target).attr("data-product");
        
        console.log('aplicar antes:'+ jQuery(".estrutura").css("display") )
        
        helper.verificaItens(component, helper, svaId);
        
        console.log('aplicar depois:'+ jQuery(".estrutura").css("display") )
    },

    navToOfertasSelecionadas : function(component, event, helper) { 

    },

    navToBack : function(component, event,  helper){

    },

    finishRendering : function(component, event, helper){
        helper.loadFinish(component, event, helper);
    }
    
    
})