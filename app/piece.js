define(['./util'], function(util) {
    var exports = {},
        pieceAddr = "http://127.0.0.1:1337/piece/"
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
        var detailPiece
        return function(){
            if( !detailPiece ){
                detailPiece = avalon.define("detailPiece",function(vm){
                    vm.id=null
                    vm.pics=[]
                    vm.currentPic=0
                    vm.content = ""
                    vm.title = ""
                    vm.author = {
                        name : "",
                        signature : ""
                    }
                    vm.cover = ''
                    vm.metrics = {}
                    vm.metricsVal = {}
                    vm.eventMetrics = {}
                    vm.$skipArray = ['metircs']
                    vm.set = function( piece){
                        _.extend( detailPiece, piece)
                        // console.log( vm.currentPic, vm)
                    }
                    vm.load = function( id ){
                        return util.api({
                            url:pieceAddr + id
                        }).done(function( piece){
                            console.log("DEB: load piece", piece)
                            vm.set(piece)
                        })
                    }
                    vm.setEventMetrics = function( eventMetrics ){
                        vm.eventMetrics = eventMetrics
                        //becaus avalon's {{}} won't listen eventMetric
                        //we set metrics here
                        var pieceMetrics = _.clone(eventMetrics)
                        _.each(pieceMetrics,function(metric, key){
                            pieceMetrics[key].val = vm.metrics[key] === undefined? metric.bottom :vm.metrics[key]
                        })
                        vm.metricsVal = pieceMetrics
                        console.log("========seting metirc val", vm.metricsVal)

                    }
                    vm.detailPieceRendered = function(a){
                        if( a == "add" && detailPiece.id){
                            renderGallary( detailPiece )
                        }
                    }
                })
            }

            return detailPiece
        }
    })()

    return exports

})