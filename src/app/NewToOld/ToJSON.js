"use client";
import react from 'react';

var et = require('elementtree');

class NewToOld {

async extractCatTree (CatTree) {
    var result = [];
    for (let i = 0; i < CatTree.length; i++) {
        var Arr = new Array(6);
        Arr[0] = CatTree.get('Title');
        Arr[1] = CatTree.get('Spotlight');
        Arr[2] = CatTree.get('LeafDisplayFormat');
        Arr[3] = CatTree.get('InternalDisplayFormat');
        Arr[4] = CatTree.get('HideTextBeforeSymbol');
        Arr[5] = CatTree.get('OneToOne');
        result.append(Arr);
    }
    return result;
}

async extractMetaSettings (etMetaSettings) {
    var SetMetadata = {
        "Name" : "",
        "Type" : "Text",
        "ShowSpotlight" : "",
        "ShowDocMeta" : "T",
        "Order" : "",
        "Display" : ""
    }
    var result = [];
    for (let i = 0; i < etMetaSettings.length; i++) {
        SetMetadata['Name'] = etMetaSettings[i].get("Name");
        SetMetadata['Display'] = etMetaSettings[i].get("Display");
        SetMetadata['ShowSpotlight'] = etMetaSettings[i].get("ShowSpotlight");
        SetMetadata['Order'] = etMetaSettings[i].get("Order");
        SetMetadata['Type'] = etMetaSettings[i].get("Type");
        SetMetadata['ShowDocMeta'] = etMetaSettings[i].get("ShowDocMeta");
        result.append(SetMetadata);
    }
    return result;
}

async extractTagSettings (etTagSettings) {
    var SetTag = {
        "Name" : "",
        "ShowSpotlight" : "",
        "Order" : "",
        "Display" : ""
    }
    var result = [];

    for (let i = 0; i < etTagSettings.length; i++) {
        SetTag['Name'] = etTagSettings[i].get('Name');
        SetTag['Order'] = etTagSettings[i].get('Order');
        SetTag['Display'] = etTagSettings[i].get('Display');
        SetTag['ShowSpotlight'] = etTagSettings[i].get('ShowSpotlight');
        result.append(SetTag);
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
            "contents" : []        
        }

        SetPara["Key"] = paragraphs.get("Key");
        var qus = paragraphs.get("Type");
        SetPara["Title"] = qus ? qus : "";
        qus = paragraphs.get("Title");
        SetPara["Aux"] = qus ? qus : SetPara["Title"];
        for (let j = 0; j < paragraphs[i].length; j++) {
            if (paragraphs[i][j].tag == '') {//work not done
            }
            //work not done
        }
        
    }

    return result;
}

async extractMetadata (metadatas) {
    var result = [];
    for (let i = 0; i < metadatas.length; i++) {result.append([docs[i].tag, docs[i].text]);}
    return result;
}

async extractDocAttachment (atts) {
    var result = [];
    for (let i = 0; i < atts.length; i++) {result.append([atts[i].get("Caption"), atts[i].get("Order"), atts[i].get("Url")]);}
    return result;
}

async extractMetaTags (Mtags) {
    var result = [];
    for (let j = 0; j < Mtags.length; j++) {result.append([Mtags[j].get("Name"), Mtags[j].get("Frequency"), Mtags[j].text]);}
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
        
        SetDoc["DocMetadata"] = this.extractMetadata(docs[i].findall("./DocMetadata/Metadata"));

        SetDoc["DocAttachment"] = this.extractDocAttachment(docs[i].find("DocAttachment"));

        var Mtags = docs[i].find("./DocContent/MetaTags");
        
        SetDoc["DocContent"]["Metatags"]["Indexing"] = Mtags.get('Indexing') == '1' ? 'F' : 'T';
        SetDoc["DocContent"]["Metatags"]["tags"] = this.extractMetaTags(Mtags)
        
        var Paras = docs[i].findall("./doc_content/Paragraph");
        SetDoc["DocContent"]["Paragraphs"] = Paras.length > 0 ? this.extractParagraphs(Paras) : []; //work not done
        
        result.append(SetDoc);
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
    var corpuses = etree.findall('./DocuXml/corpus');

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
        tmpCorpus["CatTrees"] = this.extractCatTree(etParameters.find('CorpusTrees'));

        tmpCorpus["MetadataSettings"] = this.extractMetaSettings(etMetaSettings);

        tmpCorpus["TagSettings"] = this.extractTagSettings(etTagSettings);

        var DocsRes = this.extractDoc(corpuses[i].findall("./Documents/Document"))
        if (DocsRes["error"]) {return DocsRes["error"];}
        else {tmpCorpus["Documents"] = DocsRes;}     
        outputJSON["corpuses"].append(tmpCorpus);
    }
}

}

export default NewToOld;