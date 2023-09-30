"use client";
import react from 'react';

var et = require('elementtree');

class OldToNew {

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

async extractMetaSettings (etMetaFields) {
    var SetMetadata = {
        "Name" : "",
        "Type" : "Text",
        "ShowSpotlight" : "",
        "ShowDocMeta" : "T",
        "Order" : "",
        "Display" : ""
    }
    var result = [];
    for (let i = 0; i < etMetaFields[0].length; i++) {
        SetMetadata['Name'] = etMetaFields[0][i].tag;
        SetMetadata['Display'] = etMetaFields[0][i].text;
        SetMetadata['ShowSpotlight'] = etMetaFields[0][i].get('show_spotlight') == 'Y' ? 'T' : 'F';
        SetMetadata['Order'] = etMetaFields[0][i].get('display_order');
        result.append(SetMetadata);
    }
    return result;
}

async extractFeatAnal (etFeatAnal) {
    var SetTag = {
        "Name" : "",
        "ShowSpotlight" : "",
        "Order" : "",
        "Display" : ""
    }
    var result = [];
    var tmpEle = etFeatAnal[0].findall('spotlight');
    var tmpDict = {};
    var tmpName = "";
    for (let i = 0; i < tmpEle.length; i++) {
        tmpName = tmpEle[j].get('sub_category') == '-' ? tmpEle[i].get('category') : tmpEle[i].get('category') + '/' + tmpEle[i].get('sub_category') ;
        tmpDict[tmpName] = new Array(2);
        tmpDict[tmpName][0] = tmpEle[i].get('display_order'); //Order
        tmpDict[tmpName][1] = tmpEle[i].get('title'); //Display
    }
        
    tmpEle = etFeatAnal[0].findall('tag');        
    for (let i = 0; i < tmpEle.length; i++) {
        tmpName = tmpEle[i].get('default_sub_category') == '-' ? tmpEle[i].get('default_category') : tmpEle[i].get('default_category') + '/' + tmpEle[i].get('default_sub_category') ;
        SetTag['Name'] = tmpEle[i].get('name');
        SetTag['Order'] = tmpDict[tmpName]? tmpDict[tmpName][0] : 999;
        SetTag['Display'] = tmpDict[tmpName]? tmpDict[tmpName][1] : tmpTag['Name'];
        SetTag['ShowSpotlight'] = tmpDict[tmpName]? 'T' : 'F';
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

async extractMetadata (docs) {
    var result = [];
    var name = "";
    var text = "";
    for (let i = 0; i < docs.length; i++) {
        if (docs[i].tag == "title" || docs[i].tag == "doc_att_caption" || docs[i].tag == "doc_attachment" || docs[i].tag == "doc_content") {continue;}

        else if (docs[i].tag == "xml_metadata") {
            for (let j = 0; j < docs[i].length; j++) {
                name = docs[i][j].tag;
                text = docs[i][j].text;
                result.append([name, text]);
            }
        }  

        else {
            name = docs[i].tag;
            text = docs[i].text;
            result.append([name, text]);
        }
        
    }

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

        SetDoc["DocTitle"] = docs[i].find("title").text;
        SetDoc["DocId"] = docs[i].get("filename");
        var captions = docs[i].find("doc_att_caption").text.split(';');
        var urls = docs[i].find("doc_attachment").text.split(';');

        if (captions.length != urls.length) {return {"error" : "doc_att_caption count do not equal to doc_attachment count"};}

        for (let j = 0; j < urls.length; j++) {SetDoc["DocAttachment"].append([captions[j], 999, urls[j]]);}

        var Mtags = docs[i].findall("./doc_content/MetaTags");
        if (Mtags.length > 0) {
            SetDoc["DocContent"]["Metatags"]["Indexing"] = Mtags[0].get('NoIndex') == '1' ? 'F' : 'T';
            for (let j = 0; j < Mtags[0].length; j++) {
                var name = Mtags[0][j].tag;
                var frequency = Mtags[0][j].get("Frequency");
                if (!frequency) {frequency = -1;}
                SetDoc["DocContent"]["Metatags"]["tags"].append([name, frequency, Mtags[0][j].text]);
            }
        }
        var Paras = docs[i].findall("./doc_content/Paragraph");
        SetDoc["DocContent"]["Paragraphs"] = Paras.length > 0 ? this.extractParagraphs(Paras) : []; //work not done

        SetDoc["DocMetadata"] = this.extractMetadata(docs[i]);

        result.append(SetDoc);
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
    var corpuses = etree.findall('./ThdlPrototypeExport/corpus');
    var tmpEle;
    for (let i = 0; i < corpuses.length; i++) {
        var etPageParameters = corpuses[i].findall('./PageParameters');
        var etMetaFields = corpuses[i].findall('./metadata_field_settings');
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
        if (tmpEle.length > 0) {tmpCorpus["CatTrees"] = this.extractCatTree(tmpEle);}

        tmpCorpus["MetadataSettings"] = this.extractMetaSettings(etMetaFields);
        
        tmpCorpus["TagSettings"] = this.extractFeatAnal(etFeatAnal);

        var DocsRes = this.extractDoc(corpuses[i].findall("./Documents/Document"))
        if (DocsRes["error"]) {return DocsRes["error"];}
        else {tmpCorpus["Documents"] = DocsRes;}     
        outputJSON["corpuses"].append(tmpCorpus);
    }
}

}

export default OldToNew;