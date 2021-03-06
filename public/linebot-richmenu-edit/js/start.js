'use strict';

//var vConsole = new VConsole();

const base_url = "【Node.jsサーバのURL】";

var vue_options = {
    el: "#top",
    data: {
        progress_title: '', // for progress-dialog

        menu_list: [],
        area_list: [],
        range_list: [],
        image_src: null,
        image_base64: null,
        image_view: null,
        image_width: 0,
        image_height: 0,
        bounds_new: {},
        action_new: {},
        edit_index: 0,
        image_scale: 100,
        body_json: null,
        body: {},
        menu_id: "",
        edit_mode: true,
    },
    computed: {
    },
    methods: {
        edit_reset: function(){
            this.menu_id = "";
            this.image_src = null;
            this.image_width = 0;
            this.image_height = 0;
            this.area_list = [];
            this.range_list = [];
            this.body = {};
            this.edit_mode = true;
        },
        menu_delete: async function(){
            if( !confirm('本当に削除しますか？') )
                return;

            await do_post(base_url + "/linebot-richmenu-delete", { menu_id: this.menu_id } );
            alert('削除しました。');
            this.edit_reset();
            this.menu_update();
        },
        menu_copy: async function(){
            var bin = await do_get(base_url + '/linebot-richmenu-image', { menu_id: this.menu_id });
            this.image_base64 = bufferToBase64(bin);
            var dataurl = "data:" + this.binary_type + ";base64," + this.image_base64;
            this.image_src = dataurl;
            this.image_view.onload = async () => {
                this.image_width = this.image_view.naturalWidth;
                this.image_height = this.image_view.naturalHeight;

                var json = await do_post(base_url + "/linebot-richmenu-get", { menu_id: this.menu_id } );
                console.log(json);
                this.body = json;
                delete this.body.richMenuId;
                this.area_list = json.areas;
                this.edit_mode = true;
                this.menu_id = "";
                this.style_update();
            }
        },
        menu_select: async function(){
            if( this.menu_id == '' ){
                this.edit_reset();
            }else{
                this.image_src = base_url + '/linebot-richmenu-image?menu_id=' + this.menu_id;
                this.image_view.onload = async () => {
                    this.image_width = this.image_view.naturalWidth;
                    this.image_height = this.image_view.naturalHeight;
                    this.edit_mode = false;

                    var json = await do_post(base_url + "/linebot-richmenu-get", { menu_id: this.menu_id } );
                    console.log(json);
                    this.body = json;
                    this.area_list = json.areas;
                    this.style_update();
                }
                this.image_view.onerror = async() =>{
                    alert('取得に失敗しました。');
                }
            }
        },
        menu_update: async function(){
            var json = await do_post(base_url + "/linebot-richmenu-list", {} );
            this.menu_list = json.list;
        },
        body_set_default: async function(){
            var json = await do_post(base_url + "/linebot-richmenu-set-default", { menu_id: this.menu_id } );
            console.log(json);
            alert('デフォルトに設定しました。');
        },
        body_upload: async function(){
            if( !confirm('本当にアップロードしますか？') )
                return;

            try{
                this.body_create();
                var body = {
                    image: this.image_base64,
                    object: JSON.parse(this.body_json)
                };
                var json = await do_post(base_url + "/linebot-richmenu-upload", body );
                alert('richMenuId: ' + json.richMenuId);
                this.edit_reset();
                this.menu_update();
            }catch(error){
                alert(error);
            }
        },
        body_check: function(){
            this.body_create();

            this.dialog_open("#body_view");
        },
        body_create: function(){
            this.body.size = { 
                width: this.image_width,
                height: this.image_height
            };
            if( !this.body.selected )
                this.body.selected = false;
            else
                this.body.selected = true;
            if( !this.body.name )
                this.body.name = "";
            if( !this.body.chatBarText )
                this.body.chatBarText = "";
            this.body.areas = this.area_list;
            this.body_json = JSON.stringify(this.body, null, '\t');
        },
        style_update: function(){
            var range_list = [];
            for( var i = 0 ; i < this.area_list.length ; i++ ){
                var range = {
                    position: 'absolute',
                    top: Math.floor(this.area_list[i].bounds.y * this.image_scale / 100) + 'px',
                    left: Math.floor(this.area_list[i].bounds.x * this.image_scale / 100) + 'px',
                    width: Math.floor(this.area_list[i].bounds.width * this.image_scale / 100) + 'px',
                    height: Math.floor(this.area_list[i].bounds.height * this.image_scale / 100) + 'px',
                    view: !this.range_list[i] ? true : this.range_list[i].view,
                }
                range_list.push(range);
            }
            this.range_list = range_list;
        },
        image_open: function(e){
            var file = e.target.files[0];
            this.image_open_file(file);
        },
        image_click: function(e){
            this.image_src = null;

            e.target.value = '';
        },
        image_open_file: function(file){
            var reader = new FileReader();
            reader.onload = (theFile) =>{
                this.image_src = reader.result;
                this.image_base64 = reader.result.split( ",", 2)[1];
                this.image_view.onload = () => {
                    this.image_width = this.image_view.naturalWidth;
                    this.image_height = this.image_view.naturalHeight;
                }
            };
            reader.readAsDataURL(file);
        },
        call_area_new: function(){
            this.bounds_new = {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            };
            this.action_new = {
                type: 'postback'
            };
            this.dialog_open('#area_new');
        },
        do_area_new: function(){
            var area = {
                bounds: this.bounds_new,
                action: {
                    type: this.action_new.type
                } 
            };
            if( this.action_new.type == 'postback' ){
                area.action.data = this.action_new.data;
            }else
            if( this.action_new.type == 'message' ){
                area.action.text = this.action_new.text;
            }else
            if( this.action_new.type == 'uri' ){
                area.action.uri = this.action_new.uri;
            }else
            if( this.action_new.type == 'datetimepicker' ){
                area.action.data = this.action_new.data;
                area.action.mode = this.action_new.mode;
            }

            this.area_list.push(area);
            this.style_update();

            this.dialog_close('#area_new');
        },
        call_area_delete: function(index){
            if( !confirm('本当に削除しますか？') )
                return;

            this.area_list.splice(index, 1);
            this.range_list.splice(index, 1);
        },
        call_area_view: async function(index){
            this.edit_index = index;
            this.bounds_new = JSON.parse(JSON.stringify(this.area_list[index].bounds));
            this.action_new = JSON.parse(JSON.stringify(this.area_list[index].action));

            this.dialog_open('#area_view');
        },
        call_area_edit: async function(index){
            this.edit_index = index;
            this.bounds_new = JSON.parse(JSON.stringify(this.area_list[index].bounds));
            this.action_new = JSON.parse(JSON.stringify(this.area_list[index].action));

            this.dialog_open('#area_edit');
        },
        do_area_edit: function(){
            this.area_list[this.edit_index].bounds = this.bounds_new;
            this.area_list[this.edit_index].action = this.action_new;

            this.style_update();

            this.dialog_close('#area_edit');
        },
    },
    created: function(){
    },
    mounted: function(){
        proc_load();

        this.image_view = document.querySelector("#image_view");
        this.menu_update();
    }
};
vue_add_methods(vue_options, methods_bootstrap);
vue_add_components(vue_options, components_bootstrap);
var vue = new Vue( vue_options );

function do_post(url, body) {
    const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });

    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: headers
    })
    .then((response) => {
        if (!response.ok)
            throw 'status is not 200';
        return response.json();
    });
}

function do_get(url, qs) {
    var params = new URLSearchParams(qs);
    var url2 = new URL(url);
    url2.search = params;

    return fetch(url2.toString(), {
        method: 'GET',
    })
    .then((response) => {
        if (!response.ok)
            throw 'status is not 200';
        return response.arrayBuffer();
    });
}

function bufferToBase64(buf) {
    if( buf instanceof ArrayBuffer )
        buf = new Uint8Array(buf);
    if( buf instanceof Uint8Array )
        buf = Array.from(buf);

    var binstr = buf.map(b => String.fromCharCode(b)).join("");
    return btoa(binstr);
}
