define(['./util','./global'], function(Util,Global) {
    var exports = {},
        baseUrl = Global.baseUrl,
        pieceContentSelector="#newPieceContent",
        pieceMenuSelector = "#newPieceMenu",
        previewSelector = "#newPiecePreview",
        albumUploadSelector = "#newPieceAlbumHandler",
        albumPreivewSelector = "#newPieceAlbumPreview",
        pieceCoverClass= "pieceCover",
        eventAddr = baseUrl+"event",
        eventCreateAddr = baseUrl+"event/create",
        pieceAddr = baseUrl+"piece",
        imageAddr = baseUrl + "image",
        addRelationAddr = "http://127.0.0.1:8080/drupal/api/relation.json",
        uploadImageAddr = baseUrl+"image/upload"


    exports.newPieceVm = (function(){
        var createVm

        var initUploader = (function(){
            var uploader
            return function( selector, pid ){
                if( uploader ){
                    uploader.destroy()
                }
                console.log("begin to init dropzone")
                uploader = new Dropzone(selector, { 
                    url: uploadImageAddr+'?pid='+pid,
                    withCredentials: true,
                    addRemoveLinks : true,
                    previewsContainer : albumPreivewSelector,
                    clickable: true,
                    thumbnailWidth: 180,
                    thumbnailHeight: 100,
                    dictRemoveFile : '删除',
                    dictDefaultMessage :'上传图片',
                    dictCancelUpload : '取消',
                    previewTemplate : '<div class="dz-preview dz-file-preview">'+
                      '<div class="dz-details">'+
                        '<div class="dz-filename"><span data-dz-name></span></div>'+
                        '<div class="dz-size" data-dz-size></div>'+
                        '<img data-dz-thumbnail />'+
                      '</div>'+
                      '<div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div>'+
                      '<div class="dz-error-mark"><span>✘</span></div>'+
                      '<div class="dz-error-message"><span data-dz-errormessage></span></div>'+
                    '</div>'

                });
                uploader.on("removedfile",function(file){
                    console.log("remove file", file)
                    Util.api({
                        url : imageAddr + "/" +file.id,
                        type : "delete"
                    })
                    createVm.pics = _.without(createVm.pics.$model, file.id)
                })
                uploader.on("success",function(file, res){
                    console.log("DEB: image upload suscess",res,file)
                    file.id = res.id
                    createVm.pics.push( res.id )

                    var removeButton = Dropzone.createElement("<a>设为封面</a>");
                    var _this = this;
                    removeButton.addEventListener("click", function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("set to cover",res.id)
                        createVm.cover = res.id
                        $(albumPreivewSelector).children().removeClass(pieceCoverClass)
                        $(file.previewElement).addClass(pieceCoverClass)

                    });

                    file.previewElement.appendChild(removeButton);

                })
                Util.getCsrfToken().done( function(token ){
                    uploader.on("sending", function(file, xhr) { xhr.setRequestHeader("X-CSRF-Token", token); });
                })
            }
        })()

        var Editor = (function(){
            var editor
            return function(get){
                if( get ){
                    return editor?editor.innerHTML : ''
                }

                if( editor ){
                    editor.innerHTML = ""
                    return editor
                }

                editor = document.querySelector(pieceContentSelector),
                pen = new Pen({
                    editor : editor,
                    menu : pieceMenuSelector,
                    stay : false
                })
                console.log("init pen")
                return editor
            }
        })()

        return function( general){
            if( !createVm ){
                createVm = avalon.define("createPiece",function(vm){
                    // vm.name="aaaa"
                    vm.newTitle = ""
                    vm._newMetric = {
                        name : "",
                        num : null
                    }
                    vm.pics = []
                    vm.newMetrics = {}
                    vm._metricKeys = []
                    vm._csrf = ''
                    vm.publish = function(){
                        var eid = general.getEventId() 
                        // $(previewSelector).html( editor.innerHTML )
                        if( !eid){
                            alert("请选择你要将此片段插入的事件")
                            return 
                        }
                        Util.api({
                            url : pieceAddr,
                            type:"POST",
                            data:{
                                eid : eid,
                                title : vm.newTitle,
                                content : Editor(true),
                                metrics:vm.newMetrics.$model,
                                pics : vm.pics.$model
                            }
                        }).done(function(res){
                            console.log("DEB: piece add success",res)
                            page('/event/' + eid+"?refresh=true")
                        })
                    }
                    vm.keypressMetric = function( $e ){
                        if( $e.which ==13){
                            vm.addMetric()
                        }
                    }
                    vm.addMetric = function(){
                        if( vm._newMetric.name !== "" 
                            && vm._newMetric.num !== null 
                            && vm.newMetrics[vm._newMetric.name] === undefined
                            ){
                            var placeholder = {}
                            placeholder[vm._newMetric.name] = vm._newMetric.num
                            vm.newMetrics = _.extend({},vm.newMetrics.$model,placeholder)
                            console.log('DEB: add metric', vm._newMetric.name,vm._newMetric.num,vm.newMetrics)
                        }else{
                            console.log(vm._newMetric.name !== "" ,vm._newMetric.num !== null ,vm.newMetrics[vm._newMetric.name] === undefined)
                        }
                        vm._newMetric.name = ""
                        vm._newMetric.num = null
                    }
                    vm.deleteMetric = function( metricName ){
                        if( vm.newMetrics[metricName] !== undefined){
                            vm.newMetrics = _.omit(vm.newMetrics.$model, metricName)
                        }
                    }
                    vm.reset = function(){
                        initUploader(albumUploadSelector, general.getPieceId())
                        Editor()
                        vm.newTitle = ""
                        vm.newMetrics = {}
                        vm._newMetric.name = ""
                        vm._newMetric.num = null
                    }
                })   

                general.$watch('viewMode',function(viewMode){
                    console.log("reset editor",viewMode)
                    if( viewMode == 'newPiece'){
                        console.log("reset editor")
                        createVm.reset()
                    }
                })

            }

            return createVm
        }
    })()

    exports.newEventVm = (function(){
        var createEvent
        return function(){
            if( !createEvent){
                createEvent = avalon.define("createEvent",function(vm){
                    vm.newEventTitle = ""
                    vm.newEventIntro = ""
                    vm.connecting = false
                    vm.publish= function(){
                        if( vm.connecting) return 
                        vm.connecting = true
                        Util.api({
                            url:eventCreateAddr,
                            type:"POST",
                            data:{
                                title:vm.newEventTitle,
                                content:vm.newEventIntro
                            }
                        }).done(function(res){
                            vm.connecting = false
                            page('/event/'+res.id)
                            console.log("SUS: create event suscess",res)
                        }).fail(function(res){
                            vm.connecting = false
                            console.log("ERR: create event failed",res)
                        })                      
                    }
                })
            }

            return createEvent
        }
    })()

    return exports

})