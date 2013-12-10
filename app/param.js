define([], function() {
    var exports = {};
    var renderGallary = function( vmodel ){
        console.log("DEB: rendering gallery")
        $("#slider").responsiveSlides({
            auto: false,
            pager: false,
            nav: true,
            speed: 500,
            namespace : 'slider',
            // before : function( i ){
            //     vmodel.currentPic = i
            // },
            before : function( i){
                vmodel.currentPic = i
            }
        });
    }

    exports.vmodel = (function(){
        var detailParam
        return function(){
            if( !detailParam ){
                detailParam = avalon.define("detailParam",function(vm){
                    vm.id=null
                    vm.pics=[]
                    vm.currentPic=0
                    vm.content = ""
                    vm.title = ""
                    vm.author = {
                        name : "",
                        signature : ""
                    }
                    vm.set = function( param){
                        _.extend( detailParam, param)
                        // console.log( vm.currentPic, vm)
                    }
                    vm.detailParamRendered = function(a){
                        if( a == "add" && detailParam.id){
                            renderGallary( detailParam )
                        }
                    }
                })
            }

            return detailParam
        }
    })()

    return exports

})