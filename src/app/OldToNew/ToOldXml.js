var et = require('elementtree');
var fs = require('fs')

class JsonToOldXml {

    async ToOldXml (json) {
        var ElementTree = et.ElementTree;
        var element = et.Element;
        var subelement = et.SubElement;
        var SysMeta = ['compilation_name', 'compilation_order',	'compilation_vol', 'author', 'doc_topic_l1', 'doc_topic_l2', 'doc_topic_l3', 'geo_level1',
            'geo_level2', 'geo_level3', 'geo_longitude',  'geo_latitude', 'doc_category_l1', 'doc_category_l2', 'doc_category_l3', 'docclass', 'docclass_aux', 
            'doctype', 'doctype_aux', 'book_code', 'time_orig_str', 'time_varchar', 'time_norm_year', 'era', 'time_norm_kmark', 'year_for_grouping', 'time_dynasty',
            'timeseq_not_before', 'timeseq_not_after', 'doc_source', 'doc_seq_number'];

        var root = element('ThdlPrototypeExport');
        var corpuses = json["corpuses"];
        for (let i = 0; i < corpuses.length; i++) {
            var tmpCorp = subelement(root, 'corpus');
            tmpCorp.set('name', corpuses[i]['corpusName']);

            //set PageParameter
            var PageP = subelement(tmpCorp, 'PageParameters');
            var MCI = subelement(PageP, 'MaxCueItems');
            MCI.set('Default', corpuses[i]['MaxCueNumber']);
            var HCD = subelement(PageP, 'HideCueDisplayBeforeSymbol');
            var CueSep = subelement(PageP, 'CueSeparator');
            HCD.text = corpuses[i]['HiddenPrefixDelim'][1]
            CueSep.text = corpuses[i]['HiddenPrefixDelim'][0]
            
            

            // build CatTree
            if (corpuses[i]['CatTrees'].length > 0) {
                var CTRoot = subelement(PageP, 'CorpusTrees');
                var children = corpuses[i]['CatTrees']
                for (let j = 0; j < children.length; j++) {
                    var CTChild = subelement(CTRoot, 'CatTree');
                    CTChild.set('Title', children[j][0]);
                    CTChild.set('Spotlight', children[j][1]);
                    CTChild.set('LeafDisplayFormat', children[j][2]);
                    CTChild.set('InternalDisplayFormat', children[j][3]);
                    CTChild.set('HideTextBeforeSymbol', children[j][4]);
                    CTChild.set('OneToOne', children[j][5]);
                }
            }
    

            // build metadataFieldSettings
            var Msettings = corpuses[i]['MetadataSettings']
            var MFSRoot = subelement(tmpCorp, 'metadata_field_settings');
            for (let j = 0; j < Msettings.length; j++) {
                var subE = subelement(MFSRoot, Msettings[j]['Name']);
                var YN = "";
                if (Msettings[j]['ShowSpotlight'] == 'T') {YN = 'Y';}
                else {YN = 'F';}                    
                subE.set('show_spotlight', YN);
                subE.set('display_order', Msettings[j]['Order']);
                subE.text = Msettings[j]['Display']
            }
                

            // build FeatAnalySis
            var Fsettings = corpuses[i]['TagSettings']
            var FARoot = subelement(tmpCorp, 'feature_analysis');
            for (let j = 0; j < Fsettings.length; j++) {
                var subF = subelement(FARoot, 'tag');
                subF.set('type', 'contentTagging');
                subF.set('name', Fsettings[j]['Name']);
                subF.set('default_category', Fsettings[j]['Name']);
                subF.set('default_sub_category', '-');
                if (Fsettings[j]['ShowSpotlight'] == 'T') {
                    var subS = subelement(FARoot, 'spotlight');
                    subS.set('category', Fsettings[j]['Name']);
                    subS.set('sub_category', '-');
                    subS.set('display_order', Fsettings[j]['Order']);
                    subS.set('title', Fsettings[j]['Display']);
                }
            }
            //build documents
            var tmpDoc = subelement(root, 'documents');
            var Docs = corpuses[i]['Documents']
            for (let j = 0; j < Docs.length; j++) {
                var childDoc = subelement(tmpDoc, 'document');
                //basic setting
                childDoc.set('filename', Docs[j]['DocId']);
                var title = subelement(childDoc, 'title');
                title.text = Docs[j]['DocTitle'];
                var cops = subelement(childDoc, 'corpus')
                cops.text = corpuses[i]['corpusName'];

                //extract all metadata
                var metadatas = Docs[j]['DocMetadata'];
                var UdefMeta = element('xml_metadata');
                var flag = 0;
                for (let k = 0; k < metadatas.length; k++) {
                    var MChild;
                    if (metadatas[k][0] == 'corpus') {continue;}
                    else if (SysMeta.includes(metadatas[k][0])) {MChild = subelement(childDoc, metadatas[k][0]);} 
                    else {
                        MChild = subelement(UdefMeta, metadatas[k][0]);
                        flag = 1;
                    }
                    MChild.text = metadatas[k][1];
                }
                if (flag == 1) {childDoc.append(UdefMeta);}

                //build Doc_Content
                var conts = subelement(childDoc, 'doc_content');
                    // paragraphs
                var paras = Docs[j]['DocContent']['Paragraphs'];
                for (let k = 0; k < paras.length; k++) {
                    var ParaRoot = subelement(conts, 'Paragraph');
                    if (paras[k]['Key']) {ParaRoot.set('Key', paras[k]['Key']);}
                    if (paras[k]['Title']) {ParaRoot.set('Type', paras[k]['Title']);}
                    if (paras[k]['Aux']) {ParaRoot.set('Title', paras[k]['Aux']);}
                    ParaRoot.text = paras[k]['text']
                    var Pcont = paras[k]['contents'];
                    for (let z = 0; z < Pcont.length; z++) {
                        var tmpString = '<';
                        var end = "";
                        if (Pcont[z]['tag'] == 'Tag') {
                            tmpString += Pcont[z]['attrib']['Name'] + " ";
                            end = Pcont[z]['attrib']['Name'];
                        } 
                        else {
                            tmpString += Pcont[z]['tag'] + ' ';
                            end = Pcont[z]['tag'];
                        }
                        for (let key in Pcont[z]['attrib']) {tmpString += key + ' = \'' + Pcont[z]['attrib'][key] + '\' ';}
                        if (Pcont[z]['text']) {tmpString += '>' + Pcont[z]['text'] + '</' + end + '>';}
                        if (Pcont[z]['tail']) {tmpString += Pcont[z]['tail'];}
                        ParaRoot.text += tmpString ;
                    }
                }
                    // MetaTags
                if (Docs[j]['DocContent']['Metatags']['Indexing'] != '!Not Used!') {
                    var MTRoot = subelement(conts, 'MetaTags');
                    var No_id = 1;
                    if (Docs[j]['DocContent']['Metatags']['Indexing'] == 'T') {No_id = 0;}
                    MTRoot.set('NoIndex', No_id);
                    var allMTags = Docs[j]['DocContent']['Metatags']['Tags'];
                    for (let k = 0; k < allMTags; k++) {
                        var MTChild = subelement(MTRoot, allMTags[k][0]);
                        if (allMTags[k][1] != -1) {MTChild.set('Frequency', allMTags[k][1])}
                        MTChild.text = allMTags[k][2]
                    }
                }

                //build Doc_att
                var atts = Docs[j]['DocAttachment'];    
                var caps = subelement(childDoc, 'doc_att_caption')
                var urls = subelement(childDoc, 'doc_attachment') 
                caps.text = "";
                urls.text = "";
                for (let k = 0; k < atts.length; k++) {
                    caps.text += atts[k][0];
                    urls.text += atts[k][2];
                    if (k != atts.length - 1) {
                        caps.text += ';';
                        urls.text += ';';
                    }
                }                
            }

        }
        var etree = new ElementTree(root);    
        var xml = etree.write();
        
        xml = xml.replace(/&lt;/g, '<')
        xml = xml.replace(/&gt;/g, '>')
        console.log(xml)
        fs.writeFileSync('./Old.xml', xml);
        return xml;
    }

}


module.exports = JsonToOldXml;