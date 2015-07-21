var path = require('path'),
    text = {},
    jade = global.jade,
    fs = require('fs');

fs.readdirSync(path.resolve(__dirname + '/client/lang')).toString().split(',').forEach(function (lang) {

    text[lang.split('.')[0]] = require(path.resolve(__dirname + '/client/lang/' + lang));

});


module.exports = {
    api: {

        "init": function (data, db, req, res) {

            var html = jade.compileFile('./modules/sitemap/skel.jade', {})({});

            res.send(JSON.stringify({

                html: html,
                requestID: data.requestID

            }));

        },

        "sitemap-fetch": function (data, db, req, res, user) {

            var db = user.modules.sitemap.db_host;
            var mongodb = require('mongodb').MongoClient;
            var ObjectID = require('mongodb').ObjectID;

            if (!data.query) throw "err";

            mongodb.connect(db, function (err, db) {

                var c = db.collection(user.modules.sitemap.sitemap_col);

                if(!data.contents) c.find({
                    $or: [
                        { _id: new RegExp(String(data.query)) },
                        { namespace: new RegExp(String(data.query)) }
                    ]
                }, { contents: 0 }).toArray(function (err, _data) {

                    res.send(JSON.stringify({

                        data: _data,
                        requestID: data.requestID

                    }));

                }); else {

                    c.find({
                        _id: new ObjectID(String(data.query))
                    }, { contents: 1 }).toArray(function (err, _data) {

                        var contents = _data[0].contents;
                        var IDs = [];

                        contents.forEach(function (i) { i.type == "sitemap" && IDs.push(new ObjectID(i.id)) });

                        c.find({ _id: { $in: IDs } }).toArray(function (err, _data) {

                            res.send(JSON.stringify({

                                data: _data,
                                requestID: data.requestID

                            }));

                        });

                    });

                }
            
            });

        }

    },
    settings: {

        $label: "SETTINGS_LABEL",

        live_cpu_and_mem: {
            $index: 0,
            $label: "LIVE_CPU_AND_MEM",
            $type: "boolean",
            $default: true,
            $permissions: ["sysadmin"]
        },

        live_cpu_and_mem_interval: {
            $index: 1,
            $label: "LIVE_CPU_AND_MEM_INTERVAL",
            $type: "float",
            $default: 1000,
            $minimum: 1000,
            $dependencies: ["live_cpu_and_mem"],
            $permissions: ["sysadmin"]
        },

        $group: {
            $id: "cool-group",
            $index: 2,
            $label: "SETTINGS_LABEL"
        }

    },
    text: text
}

module.exports.api.auth = true;