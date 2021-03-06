/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/

var util = require("util");
var fs = require("fs");
var path = require("path");

var Opcodes = require("./opcodes.js");
var Loader = require("./loader.js");


var JVM = module.exports = function() {
    if (this instanceof JVM) {
        process.JVM = {
            Loader: new Loader(),
            Threads: 1
        }
    } else {
        return new JVM();
    }
}

JVM.prototype.loadClassFile = function(fileName) {
    return process.JVM.Loader.loadClassFile(fileName);
}

JVM.prototype.loadClassFiles = function(dirName) {
    var self = this;
    var files = fs.readdirSync(dirName);
    files.forEach(function(file) {
        var p = util.format("%s/%s", dirName, file);
        var stat = fs.statSync(p);
        if (stat.isFile()) {
            if (path.extname(file) === ".class") {
                self.loadClassFile(p);
            }
        } else if (stat.isDirectory()) {
            self.loadClassFiles(p);
        }
    });
}

JVM.prototype.loadJSFile = function(fileName) {
    return process.JVM.Loader.loadJSFile(fileName);
}


JVM.prototype.run = function() {
    var entryPointFrame = process.JVM.Loader.getEntryPointFrame();
    
    if (!entryPointFrame) {
        throw new Error("Entry point method is not found.");
    }
    
    var notSupportOpcode = [];
    for (var opcode in Opcodes) {
        if (!entryPointFrame[opcode]) {
            if (["return", "ireturn", "lreturn", "dreturn", "freturn", "areturn"].indexOf(opcode) === -1) {
                notSupportOpcode.push(opcode);
            }
        }
    }
    if (notSupportOpcode.length > 0) {
        util.debug("Not support opcodes: " + notSupportOpcode.toString());
    }
    
    
    entryPointFrame.run(arguments, function(code) {
        var halt = function() {
            setImmediate(function() {
                if (process.JVM.Threads === 1) {
                    process.exit(code);
                } else {
                    halt();
                }
            });
        };
        halt();
    });
    
}

