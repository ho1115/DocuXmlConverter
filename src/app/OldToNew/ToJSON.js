"use client";
import react from 'react';

var et = require('elementtree');

class OldToNew {

async OldToNewJson (xml) {
    
    var SetCorpus = {
        "corpusName" : "",        
        "MaxCueNumber" : 0,
        "CatTrees" : [],
        "MetadataSettings" : [],
        "TagSettings" : [],
        "Documents" : [],
    }

    var SetMetadata = {
        "Name" : "",
        "Type" : "Text",
        "ShowSpotlight" : "",
        "ShowDocMeta" : "T",
        "Order" : "",
        "Display" : ""
    }

    var SetTag = {
        "Name" : "",
        "ShowSpotlight" : "",
        "Order" : "",
        "Display" : ""
    }
    var SetTag = {
        "Name" : "",
        "ShowSpotlight" : "",
        "Order" : "",
        "Display" : ""
    }

    var SetDoc = {
        "DocMetadata" : [],
        "DocContent" : {
            "Paragraphs" : [],
            //"Aligns" : [],
            /*"CommentAreas" : {
                "Level" : "!Not Used!",
                "comments" : [],
            },*/
            "Metatags" : {
                "indexing" : "!Not Used!",
                "tags" : []
            }
        },
        "DocAttachment" : []
    }

    var SetParagraph = {
        "Key" : "",
        "Title" : "",
        "Aux" : "",
        "contents" : []        
    }


    var etree = et.parse(xml);
    var outputJSON = {};
    var corpuses = etree.findall('./ThdlPrototypeExport/corpus');
    var etPageParameters = etree.findall('./ThdlPrototypeExport/corpus/PageParameters');
    var etMetaFields = etree.findall('./ThdlPrototypeExport/corpus/metadata_field_settings');
    var etFeatAnal = etree.findall('./ThdlPrototypeExport/corpus/feature_analysis');
    var tmpEle;
    for (let i = 0; i < corpuses.length; i++) {
        SetCorpus["corpusName"] = corpuses[i].get('name');
        SetCorpus["MaxCueNumber"] = etPageParameters[i].findall('MaxCueItems')[0].get('Default');
        tmpEle = etPageParameters[i].findall('CorpusTrees/CatTree');
        if (tmpEle.length > 0) {
            for (let j = 0; j < tmpEle.length; j++) {
                var tmpArr = new Array(6);
                tmpArr[0] = tmpEle.get('Title');
                tmpArr[1] = tmpEle.get('Spotlight');
                tmpArr[2] = tmpEle.get('LeafDisplayFormat');
                tmpArr[3] = tmpEle.get('InternalDisplayFormat');
                tmpArr[4] = tmpEle.get('HideTextBeforeSymbol');
                tmpArr[5] = tmpEle.get('OneToOne');
                SetCorpus["CatTrees"].append(tmpArr);
            }
        }

        for (let j = 0; j < etMetaFields[i].length; j++) {
            SetMetadata['Name'] = etMetaFields[i][j].tag;
            SetMetadata['Display'] = etMetaFields[i][j].text;
            SetMetadata['ShowSpotlight'] = etMetaFields[i][j].get('show_spotlight') == 'Y' ? 'T' : 'F';
            SetMetadata['Order'] = etMetaFields[i][j].get('display_order');
            SetCorpus["MetadataSettings"].append(SetMetadata);
        }

        tmpEle = etFeatAnal[i].findall('spotlight');
        var tmpDict = {};
        var tmpName = "";
        for (let j = 0; j < tmpEle.length; j++) {
            tmpName = tmpEle[j].get('sub_category') == '-' ? tmpEle[j].get('category') : tmpEle[j].get('category') + '/' + tmpEle[j].get('sub_category') ;
            tmpDict[tmpName] = new Array(2);
            tmpDict[tmpName][0] = tmpEle[j].get('display_order'); //Order
            tmpDict[tmpName][1] = tmpEle[j].get('title'); //Display
        }
        
        tmpEle = etFeatAnal[i].findall('tag');
        for (let j = 0; j < tmpEle.length; j++) {
            tmpName = tmpEle[j].get('default_sub_category') == '-' ? tmpEle[j].get('default_category') : tmpEle[j].get('default_category') + '/' + tmpEle[j].get('default_sub_category') ;
            SetTag['Name'] = tmpEle[j].get('name');
            SetTag['Order'] = tmpDict[tmpName]? tmpDict[tmpName][0] : 999;
            SetTag['Display'] = tmpDict[tmpName]? tmpDict[tmpName][1] : SetTag['Name'];
            SetTag['ShowSpotlight'] = tmpDict[tmpName]? 'T' : 'F';
            SetCorpus["TagSettings"].append(SetTag);
        }

        

    }
}

}

export default OldToNew;