"use client";

var et = require('elementtree');
var fs = require('fs')

class OldToNew {

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

async extractMetaSettings (etMetaFields) {
    
    var result = [];
    var childs = etMetaFields._children
    for (let i = 0; i < childs.length; i++) {
        var SetMetadata = {
            "Name" : "",
            "Type" : "Text",
            "ShowSpotlight" : "",
            "ShowDocMeta" : "T",
            "Order" : "",
            "Display" : ""
        }
        SetMetadata['Name'] = childs[i].tag;
        SetMetadata['Display'] = childs[i].text;
        SetMetadata['ShowSpotlight'] = childs[i].get('show_spotlight') == 'Y' ? 'T' : 'F';
        SetMetadata['Order'] = childs[i].get('display_order');
        result.push(SetMetadata);
    }
 
    return result;
}

async extractFeatAnal (etFeatAnal) {
    
    var result = [];
    var tmpEle = etFeatAnal[0].findall('spotlight');
    var tmpDict = {};
    var tmpName = "";
    for (let i = 0; i < tmpEle.length; i++) {
        tmpName = tmpEle[i].get('sub_category') == '-' ? tmpEle[i].get('category') : tmpEle[i].get('category') + '/' + tmpEle[i].get('sub_category') ;
        tmpDict[tmpName] = new Array(2);
        tmpDict[tmpName][0] = tmpEle[i].get('display_order'); //Order
        tmpDict[tmpName][1] = tmpEle[i].get('title'); //Display
    }
        
    tmpEle = etFeatAnal[0].findall('tag');        
    for (let i = 0; i < tmpEle.length; i++) {
        var SetTag = {
            "Name" : "",
            "ShowSpotlight" : "",
            "Order" : "",
            "Display" : ""
        }
        tmpName = tmpEle[i].get('default_sub_category') == '-' ? tmpEle[i].get('default_category') : tmpEle[i].get('default_category') + '/' + tmpEle[i].get('default_sub_category') ;
        SetTag['Name'] = tmpEle[i].get('name');
        SetTag['Order'] = tmpDict[tmpName]? tmpDict[tmpName][0] : 999;
        SetTag['Display'] = tmpDict[tmpName]? tmpDict[tmpName][1] : SetTag['Name'];
        SetTag['ShowSpotlight'] = tmpDict[tmpName]? 'T' : 'F';
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
        var qus = paragraphs[i].get("Type");
        SetPara["Title"] = qus ? qus : "";
        qus = paragraphs[i].get("Title");
        SetPara["Aux"] = qus ? qus : SetPara["Title"];
        SetPara["text"] = paragraphs[i].text;
        var childs = paragraphs[i]._children
        for (let j = 0; j < childs.length; j++) {
            if (childs[j].tag != 'Annotation' && childs[j].tag != 'Comment') {
                childs[j].set('Name', childs[j].tag);
                childs[j].tag = 'Tag';
            }
        }
        SetPara["contents"] = childs
        result.push(SetPara)
    }

    return result;
}

async extractMetadata (docs) {
    var result = [];
    var name = "";
    var text = "";
    var childs = docs._children
    for (let i = 0; i < childs.length; i++) {
        if (childs[i].tag == "title" || childs[i].tag == "doc_att_caption" || childs[i].tag == "doc_attachment" || childs[i].tag == "doc_content") {continue;}

        else if (childs[i].tag == "xml_metadata") {
            var subChilds = childs[i]._children;
            for (let j = 0; j < subChilds.length; j++) {
                name = subChilds[j].tag;
                text = subChilds[j].text;
                result.push([name, text]);
            }
        }  

        else {
            name = childs[i].tag;
            text = childs[i].text;
            result.push([name, text]);
        }
        
    }

    return result;

}

async extractDoc (docs) {

    var result = []

    for (let i = 0; i < docs.length; i++) {
        console.log('haha')
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

        SetDoc["DocTitle"] = docs[i].find("title").text;
        SetDoc["DocId"] = docs[i].get("filename");
        var captions = docs[i].find("doc_att_caption").text.split(';');
        var urls = docs[i].find("doc_attachment").text.split(';');

        if (captions.length != urls.length) {return {"error" : "doc_att_caption count do not equal to doc_attachment count"};}

        for (let j = 0; j < urls.length; j++) {SetDoc["DocAttachment"].push([captions[j], 999, urls[j]]);}

        var Mtags = docs[i].find("./MetaTags");
        
        if (Mtags) {
            var childs = Mtags._children
            SetDoc["DocContent"]["Metatags"]["Indexing"] = Mtags.get('NoIndex') == '1' ? 'F' : 'T';
            for (let j = 0; j < childs.length; j++) {
                var name = childs[j].tag;
                var frequency = childs[j].get("Frequency");
                if (!frequency) {frequency = -1;}
                SetDoc["DocContent"]["Metatags"]["tags"].push([name, frequency, childs[j].text]);
            }
        }
        var Paras = docs[i].findall("./doc_content/Paragraph");
        SetDoc["DocContent"]["Paragraphs"] = Paras.length > 0 ? await this.extractParagraphs(Paras) : []; //work not done

        SetDoc["DocMetadata"] = await this.extractMetadata(docs[i]);

        result.push(SetDoc);
    }
    return result;

}

async OldToNewJson (xml) {
    
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
    var corpuses = etree.findall('./corpus');
    var allDocs = etree.findall('./documents');
    var tmpEle;
    for (let i = 0; i < corpuses.length; i++) {
        
        var etPageParameters = corpuses[i].findall('./PageParameters');
        var etMetaFields = corpuses[i].find('./metadata_field_settings');
        var etFeatAnal = corpuses[i].findall('./feature_analysis');
        var tmpCorpus = SetCorpus;
        tmpCorpus["Order"] = i+1;
        tmpCorpus["corpusName"] = corpuses[i].get('name');
        tmpCorpus["MaxCueNumber"] = etPageParameters[0].findall('MaxCueItems')[0].get('Default');
        tmpEle = etPageParameters[0].findall('HideCueDisplayBeforeSymbol');
        if (tmpEle.length > 0) {
            tmpCorpus["HiddenPrefixDelim"][1] = tmpEle[0].text
            tmpCorpus["HiddenPrefixDelim"][0] = etPageParameters[0].findall('CueSeparator')[0].text
        }

        tmpEle = etPageParameters[0].findall('CorpusTrees/CatTree');
        if (tmpEle.length > 0) {tmpCorpus["CatTrees"] = await this.extractCatTree(tmpEle);}

        tmpCorpus["MetadataSettings"] = await this.extractMetaSettings(etMetaFields);
        
        tmpCorpus["TagSettings"] = await this.extractFeatAnal(etFeatAnal);
        
        var DocsRes = await this.extractDoc(allDocs[i].findall("./document"))
        if (DocsRes["error"]) {return DocsRes["error"];}
        else {tmpCorpus["Documents"] = DocsRes;}    
        outputJSON["corpuses"].push(tmpCorpus); 
        
    }
    
    fs.writeFileSync('./tuck.txt',  JSON.stringify(outputJSON));
    return outputJSON;
}

}

module.exports = OldToNew;