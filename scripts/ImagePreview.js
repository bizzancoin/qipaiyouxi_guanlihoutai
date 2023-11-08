/*
ͼƬ����Ԥ�� 2013-10-16
*/

var ImagePreview = function(file, img, options) {
	
	this.file = $$(file);//�ļ�����
	this.img = $$(img);//Ԥ��ͼƬ����
	this._preload = null;//Ԥ��ͼƬ����
	this._data = "";//ͼ������
	this._upload = null;//remoteģʽʹ�õ��ϴ��ļ�����
	
	var opt = this._setOptions(options);
	
	this.action = opt.action;
	this.timeout = opt.timeout;
	this.ratio = opt.ratio;
	this.maxWidth = opt.maxWidth;
	this.maxHeight = opt.maxHeight;
	
	this.onCheck = opt.onCheck;
	this.onShow = opt.onShow;
	this.onErr = opt.onErr;
	
	//�������ݻ�ȡ����
	this._getData = this._getDataFun(opt.mode);
	//����Ԥ����ʾ����
	this._show = opt.mode !== "filter" ? this._simpleShow : this._filterShow;
};
//�����������ȡģʽ
ImagePreview.MODE = $$B.ie7 || $$B.ie8 ? "filter" : $$B.firefox ? "domfile" : $$B.opera || $$B.chrome || $$B.safari ? "remote" : "simple";

//͸��ͼƬ
ImagePreview.TRANSPARENT = "transparent.jpg";

ImagePreview.prototype = {
    //����Ĭ������
    _setOptions: function (options) {
        this.options = {//Ĭ��ֵ
            mode: ImagePreview.MODE, //Ԥ��ģʽ
            ratio: 0, //�Զ������
            maxWidth: 0, //����ͼ���
            maxHeight: 0, //����ͼ�߶�
            onCheck: function () { }, //Ԥ�����ʱִ��
            onShow: function () { }, //Ԥ��ͼƬʱִ��
            onErr: function () { }, //Ԥ������ʱִ��
            //������remoteģʽʱ��Ч
            action: undefined, //����action
            timeout: 0//���ó�ʱ(0Ϊ������)
        };
        return $$.extend(this.options, options || {});
    },
    //��ʼԤ��
    preview: function () {
        if (this.file && false !== this.onCheck()) {
            this._preview(this._getData());
        }
    },

    //����mode�������ݻ�ȡ����
    _getDataFun: function (mode) {
        switch (mode) {
            case "filter":
                return this._filterData;
            case "domfile":
                return this._domfileData;
            case "remote":
                return this._remoteData;
            case "simple":
            default:
                return this._simpleData;
        }
    },
    //�˾����ݻ�ȡ����
    _filterData: function () {
        this.file.select();
        try {
            return document.selection.createRange().text;
        } finally { document.selection.empty(); }
    },
    //domfile���ݻ�ȡ����
    _domfileData: function () {
        //return this.file.files[0].getAsDataURL();
        return window.URL.createObjectURL(this.file.files[0]);
    },
    //Զ�����ݻ�ȡ����
    _remoteData: function () {
        this._setUpload();
        console.log(this.action);
        console.log(this._upload);
        console.log()
        this._upload && this._upload.upload();
    },
    //һ�����ݻ�ȡ����
    _simpleData: function () {
        return this.file.value;
    },

    //����remoteģʽ���ϴ��ļ�����
    _setUpload: function () {
        if (this.action !== undefined) {
            var oThis = this;
            this._upload = new QuickUpload(this.file, {
                onReady: function () {
                    this.action = oThis.action; this.timeout = oThis.timeout;
                    var parameter = this.parameter;
                    parameter.ratio = oThis.ratio;
                    parameter.width = oThis.maxWidth;
                    parameter.height = oThis.maxHeight;
                },
                onFinish: function (iframe) {
                    try {
                        oThis._preview(iframe.contentWindow.document.body.innerHTML);
                    } catch (e) { oThis._error("remote error"); }
                },
                onTimeout: function () { oThis._error("timeout error"); }
            });
        }
    },

    //Ԥ������
    _preview: function (data) {
        //��ֵ����ͬ��ֵ��ִ����ʾ
        if (!!data && data !== this._data) {
            this._data = data; this._show();
        }
    },

    //����һ��Ԥ��ͼƬ����
    _simplePreload: function () {
        if (!this._preload) {
            var preload = this._preload = new Image(), oThis = this,
			onload = function () { oThis._imgShow(oThis._data, this.width, this.height); };
            this._onload = function () { this.onload = null; onload.call(this); }
            preload.onload = $$B.ie ? this._onload : onload;
            preload.onerror = function () { oThis._error(); };
        } else if ($$B.ie) {
            this._preload.onload = this._onload;
        }
    },
    //һ����ʾ
    _simpleShow: function () {
        this._simplePreload();
        this._preload.src = this._data;
    },

    //�����˾�Ԥ��ͼƬ����
    _filterPreload: function () {
        if (!this._preload) {
            var preload = this._preload = document.createElement("div");
            //���ز������˾�
            $$D.setStyle(preload, {
                width: "1px", height: "1px",
                visibility: "hidden", position: "absolute", left: "-9999px", top: "-9999px",
                filter: "progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod='image')"
            });
            //����body
            var body = document.body; body.insertBefore(preload, body.childNodes[0]);
        }
    },
    //�˾���ʾ
    _filterShow: function () {
        this._filterPreload();
        var preload = this._preload,
		data = this._data.replace(/[)'"%]/g, function (s) { return escape(escape(s)); });
        try {
            preload.filters.item("DXImageTransform.Microsoft.AlphaImageLoader").src = data;
        } catch (e) { this._error("filter error"); return; }
        //�����˾�����ʾ
        this.img.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod='scale',src=\"" + data + "\")";
        //this._imgShow( ImagePreview.TRANSPARENT, preload.offsetWidth, preload.offsetHeight );
        if ($$B.ie) {
            if ($$B.ie8) {
                this._imgShow(ImagePreview.TRANSPARENT, preload.offsetWidth, preload.offsetHeight);
            } else {
                this._imgShow(data, preload.offsetWidth, preload.offsetHeight);
            }
        } else {
            this._imgShow(ImagePreview.TRANSPARENT, preload.offsetWidth, preload.offsetHeight);
        }

    },

    //��ʾԤ��
    _imgShow: function (src, width, height) {
        var img = this.img, style = img.style,
		ratio = Math.max(0, this.ratio) || Math.min(1,
				Math.max(0, this.maxWidth) / width || 1,
				Math.max(0, this.maxHeight) / height || 1
			);
        //����Ԥ���ߴ�
        style.width = Math.round(width * ratio) + "px";
        style.height = Math.round(height * ratio) + "px";
        //����src
        img.src = src;
        this.onShow();
    },

    //���ٳ���
    dispose: function () {
        //�����ϴ��ļ�����
        if (this._upload) {
            this._upload.dispose(); this._upload = null;
        }
        //����Ԥ��ͼƬ����
        if (this._preload) {
            var preload = this._preload, parent = preload.parentNode;
            this._preload = preload.onload = preload.onerror = null;
            parent && parent.removeChild(preload);
        }
        //������ض���
        this.file = this.img = null;
    },
    //����
    _error: function (err) {
        this.onErr(err);
    }
}