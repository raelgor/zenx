// Fancy console log
ZenX.log = function (message, object) {

    // $('.debugger').append('<div>' + message + '</div>');

    if (typeof message != "string") object = message;

    var c1 = 'color:white;             font-size: 14px; text-shadow: 1px 1px 1px #999, -1px 1px 1px #999, -1px -1px 1px #999, 1px -1px 1px #999',
        c2 = 'color:yellow;            font-size: 14px; text-shadow: 1px 1px 1px #999, -1px 1px 1px #999, -1px -1px 1px #999, 1px -1px 1px #999',
        c3 = 'color:white;             font-size: 14px; text-shadow: 1px 1px 1px #999, -1px 1px 1px #999, -1px -1px 1px #999, 1px -1px 1px #999',
        c4 = 'color: rgb(6, 152, 154); font-size: 12px;',
        str = '%c[Zen%cX%c]%c ' + (typeof message == "string" ? message : '');

    object ? console.log(str, c1, c2, c3, c4, object) : console.log(str, c1, c2, c3, c4);

}