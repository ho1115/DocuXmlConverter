"use client";

var et = require('elementtree');
var fs = require('fs')
class NewToOld {

async extractCatTree (CatTree) {
    var result = [];
    var childs = CatTree._children
    for (let i = 0; i < childs.length; i++) {
        var Arr = new Array(6);
        Arr[0] = childs[i].get('Title');
        Arr[1] = childs[i].get('Spotlight');
        Arr[2] = childs[i].get('LeafDisplayFormat');
        Arr[3] = childs[i].get('InternalDisplayFormat');
        Arr[4] = childs[i].get('HideTextBeforeSymbol');
        Arr[5] = childs[i].get('OneToOne');
        result.push(Arr);
    }
    return result;
}

async extractMetaSettings (etMetaSettings) {

    var result = [];
    var childs = etMetaSettings._children
    for (let i = 0; i < childs.length; i++) {
        var SetMetadata = {
            "Name" : "",
            "Type" : "Text",
            "ShowSpotlight" : "",
            "ShowDocMeta" : "T",
            "Order" : "",
            "Display" : ""
        }
        SetMetadata['Name'] = childs[i].get("Name");
        SetMetadata['Display'] = childs[i].get("Display");
        SetMetadata['ShowSpotlight'] = childs[i].get("ShowSpotlight");
        SetMetadata['Order'] = childs[i].get("Order");
        SetMetadata['Type'] = childs[i].get("Type");
        SetMetadata['ShowDocMeta'] = childs[i].get("ShowDocMeta");
        result.push(SetMetadata);
    }
    return result;
}

async extractTagSettings (etTagSettings) {
    
    var result = [];
    var childs = etTagSettings._children
    for (let i = 0; i < childs.length; i++) {
        var SetTag = {
            "Name" : "",
            "ShowSpotlight" : "",
            "Order" : "",
            "Display" : ""
        }
        SetTag['Name'] = childs[i].get('Name');
        SetTag['Order'] = childs[i].get('Order');
        SetTag['Display'] = childs[i].get('Display');
        SetTag['ShowSpotlight'] = childs[i].get('ShowSpotlight');
        result.push(SetTag);
    }

    return result;
}

async extractParagraphs (paragraphs) {

    var result = [];
    
    for (let i = 0; i < paragraphs.length; i++) {

        var SetPara = {
            "Key" : "",
            "Title" : "",
            "Aux" : "",
            "text" : "", 
            "contents" : ""       
        }

        SetPara["Key"] = paragraphs[i].get("Key");
        var qus = paragraphs[i].get("Title");
        SetPara["Title"] = qus ? qus : "";
        qus = paragraphs[i].get("Aux");
        SetPara["Aux"] = qus ? qus : SetPara["Title"];
        var childs = paragraphs[i]._children
        SetPara["contents"] = childs
        SetPara["text"] = paragraphs[i].text;
        result.push(SetPara)
        
    }

    return result;
}

async extractMetadata (metadatas) {
    var result = [];
    for (let i = 0; i < metadatas.length; i++) {result.push([metadatas[i].get('Name'), metadatas[i].text]);}
    return result;
}

async extractDocAttachment (atts) {
    var result = [];
    var childs = atts._children
    for (let i = 0; i < childs.length; i++) {result.push([childs[i].get("Caption"), childs[i].get("Order"), childs[i].get("Url")]);}
    return result;
}

async extractMetaTags (Mtags) {
    var result = [];
    var childs = Mtags._children
    for (let j = 0; j < childs.length; j++) {result.push([childs[j].get("Name"), childs[j].get("Frequency"),childs[j].text]);}
    return result;
}

async extractDoc (docs) {

    var result = []

    for (let i = 0; i < docs.length; i++) {
        
        var SetDoc = {
            "DocId" : "",
            "DocTitle" : "",
            "DocMetadata" : [],
            "DocContent" : {
                "Paragraphs" : [],
                /*"Aligns" : [],
                "CommentAreas" : {
                    "Level" : "!Not Used!",
                    "comments" : [],
                },*/
                "Metatags" : {
                    "Indexing" : "!Not Used!",
                    "tags" : []
                }
            },
            "DocAttachment" : []
        }

        SetDoc["DocId"] = docs[i].get("DocId");

        SetDoc["DocTitle"] = docs[i].find("DocTitle").text;
        
        SetDoc["DocMetadata"] = await this.extractMetadata(docs[i].findall("./DocMetadata/Metadata"));

        SetDoc["DocAttachment"] = await this.extractDocAttachment(docs[i].find("DocAttachment"));

        var Mtags = docs[i].find("./DocContent/MetaTags");
        
        if (Mtags) {
            SetDoc["DocContent"]["Metatags"]["Indexing"] = Mtags.get('Indexing') == '1' ? 'F' : 'T';
            SetDoc["DocContent"]["Metatags"]["tags"] = await this.extractMetaTags(Mtags);
        }
        
        var Paras = docs[i].findall("./DocContent/Paragraph");
        SetDoc["DocContent"]["Paragraphs"] = Paras.length > 0 ? await this.extractParagraphs(Paras) : []; //work not done
        
        result.push(SetDoc);
    }
    return result;

}

async NewToOldJson (xml) {
    
    var SetCorpus = {
        "Order" : 999,
        "corpusName" : "",        
        "MaxCueNumber" : 200,
        "HiddenPrefixDelim" : ["", "="],
        "BreakLine" : "F",
        "CatTrees" : [],
        "MetadataSettings" : [],
        "TagSettings" : [],
        "Documents" : [],
    }


    var etree = et.parse(xml);
    var outputJSON = {
        "corpuses" : []
    };
    var corpuses = etree.findall('./Corpus');

    for (let i = 0; i < corpuses.length; i++) {
        var etParameters = corpuses[i].find("./Parameters");
        var etMetaSettings = corpuses[i].find("./MetadataSettings");
        var etTagSettings = corpuses[i].find("./TagSettings");
        var tmpCorpus = SetCorpus;

        tmpCorpus["Order"] = corpuses[i].get("Order");
        tmpCorpus["corpusName"] = corpuses[i].get("Name");


        tmpCorpus["MaxCueNumber"] = etParameters.find('MaxCueNumber').text;        
        tmpCorpus["HiddenPrefixDelim"][1] = etParameters.find('HiddenPrefixDelim').text;
        tmpCorpus["HiddenPrefixDelim"][0] = etParameters.find('HiddenPrefixDelim').get("CueDelim");
        tmpCorpus["BreakLine"] = etParameters.find('BreakLine').text;
        tmpCorpus["CatTrees"] = await this.extractCatTree(etParameters.find('CorpusTrees'));

        tmpCorpus["MetadataSettings"] = await this.extractMetaSettings(etMetaSettings);

        tmpCorpus["TagSettings"] = await this.extractTagSettings(etTagSettings);

        var DocsRes = await this.extractDoc(corpuses[i].findall("./Documents/Document"))
        if (DocsRes["error"]) {return DocsRes["error"];}
        else {tmpCorpus["Documents"] = DocsRes;}     
        outputJSON["corpuses"].push(tmpCorpus);
    }
    return outputJSON;
}

}

module.exports = NewToOld;