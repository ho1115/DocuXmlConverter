var et = require('elementtree');
var fs = require('fs')

class JsonToNewXml {

    async ToNewXml (json) {
        var ElementTree = et.ElementTree;
        var element = et.Element;
        var subelement = et.SubElement;

        var root = element('DocuXml');
        var corpuses = json["corpuses"];
        for (let i = 0; i < corpuses.length; i++) {
            var tmpCorp = subelement(root, 'corpus');
            tmpCorp.set('Name', corpuses[i]['corpusName']);
            tmpCorp.set('Order', corpuses[i]['Order']);

            //set Parameters
            var PageP = subelement(tmpCorp, 'Parameters');
            var MCI = subelement(PageP, 'MaxCueNumber');
            MCI.text = corpuses[i]['MaxCueNumber'];
            var HCD = subelement(PageP, 'HiddenPrefixDelim');
            HCD.text = corpuses[i]['HiddenPrefixDelim'][1];
            HCD.set('CueDelim', corpuses[i]['HiddenPrefixDelim'][0])
            var BrkL = subelement(PageP, 'BreakLine');
            BrkL.text = corpuses[i]['BreakLine']        
            

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
    

            // build MetadataSettings
            var Msettings = corpuses[i]['MetadataSettings']
            var MFSRoot = subelement(tmpCorp, 'MetadataSettings');
            for (let j = 0; j < Msettings.length; j++) {
                var subE = subelement(MFSRoot, 'metadata');                  
                subE.set('ShowSpotlight', Msettings[j]['ShowSpotlight']);
                subE.set('Order', Msettings[j]['Order']);
                subE.set('Name', Msettings[j]['Name']);
                subE.set('ShowDocMeta', Msettings[j]['ShowDocMeta']);
                subE.set('Display', Msettings[j]['Display']);
            }
                

            // build TagSettings
            var Fsettings = corpuses[i]['TagSettings']
            var FARoot = subelement(tmpCorp, 'TagSettings');
            for (let j = 0; j < Fsettings.length; j++) {
                var subF = subelement(FARoot, 'tag');
                subF.set('ShowSpotlight', Fsettings[j]['ShowSpotlight']);
                subF.set('Name', Fsettings[j]['Name']);
                subF.set('Order', Fsettings[j]['Order']);
                subF.set('Display', Fsettings[j]['Display']);
            }
            //build documents
            var tmpDoc = subelement(tmpCorp, 'Documents');
            var Docs = corpuses[i]['Documents']
            for (let j = 0; j < Docs.length; j++) {
                var childDoc = subelement(tmpDoc, 'Document');
                //basic setting
                childDoc.set('DocId', Docs[j]['DocId']);
                var title = subelement(childDoc, 'DocTitle');
                title.text = Docs[j]['DocTitle'];

                //extract all metadata
                var metadatas = Docs[j]['DocMetadata'];
                var MetaRoot = subelement(childDoc, 'DocMetadata')
                for (let k = 0; k < metadatas.length; k++) {
                    var MChild = subelement(MetaRoot, 'MetaData');
                    MChild.set('Name', metadatas[k][0]);
                    MChild.text = metadatas[k][1];
                }
                

                //build Doc_Content
                var conts = subelement(childDoc, 'DocContent');
                    // paragraphs
                var paras = Docs[j]['DocContent']['Paragraphs'];
                for (let k = 0; k < paras.length; k++) {
                    var ParaRoot = subelement(conts, 'Paragraph');
                    if (paras[k]['Key']) {ParaRoot.set('Key', paras[k]['Key']);}
                    if (paras[k]['Title']) {ParaRoot.set('Title', paras[k]['Title']);}
                    if (paras[k]['Aux']) {ParaRoot.set('Aux', paras[k]['Aux']);}
                    ParaRoot.text = paras[k]['text']
                    var Pcont = paras[k]['contents'];
                    for (let z = 0; z < Pcont.length; z++) {
                        var tmpString = '<';
                        var end = "";                        
                        tmpString += Pcont[z]['tag'] + ' ';
                        end = Pcont[z]['tag'];                        
                        for (let key in Pcont[z]['attrib']) {tmpString += key + ' = \'' + Pcont[z]['attrib'][key] + '\' ';}
                        if (Pcont[z]['text']) {tmpString += '>' + Pcont[z]['text'] + '</' + end + '>';}
                        if (Pcont[z]['tail']) {tmpString += Pcont[z]['tail'];}
                        ParaRoot.text += tmpString ;
                    }
                }
                    // MetaTags
                if (Docs[j]['DocContent']['Metatags']['Indexing'] != '!Not Used!') {
                    var MTRoot = subelement(conts, 'MetaTags');
                    MTRoot.set('Indexing', Docs[j]['DocContent']['Metatags']['Indexing']);
                    var allMTags = Docs[j]['DocContent']['Metatags']['Tags'];
                    for (let k = 0; k < allMTags; k++) {
                        var MTChild = subelement(MTRoot, 'MetaTag');
                        if (allMTags[k][1] != -1) {MTChild.set('Frequency', allMTags[k][1])}
                        MTChild.set('Name', allMTags[k][0])
                        MTChild.text = allMTags[k][2]
                    }
                }

                //build Doc_att
                var atts = Docs[j]['DocAttachment'];    
                var DARoot = subelement(childDoc, 'DocAttachment')
                for (let k = 0; k < atts.length; k++) {
                    var DAChild = subelement(DARoot, 'Attachment')
                    DAChild.set('Caption', atts[k][0]);
                    DAChild.set('Order', atts[k][1]);
                    DAChild.set('Url', atts[k][2]);
                }  
            }

        }
        var etree = new ElementTree(root);    
        var xml = etree.write();
        
        xml = xml.replace(/&lt;/g, '<')
        xml = xml.replace(/&gt;/g, '>')
        console.log(xml)
        fs.writeFileSync('./New.xml', xml);
        return xml;
    }

}


module.exports = JsonToNewXml;