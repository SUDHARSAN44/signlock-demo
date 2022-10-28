import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import { Box, Column, Heading, Row, Stack, Button } from 'gestalt';
import { selectDocToSign } from './SignDocumentSlice';
import { storage, updateDocumentToSign } from '../../firebase/firebase';
import { selectUser } from '../../firebase/firebaseSlice';
import WebViewer from '@pdftron/webviewer';
import WebViewerPDFTron from '../WebViewerPDFTron/index'
import 'gestalt/dist/gestalt.css';
import './SignDocument.css';
import Barcode from '../Barcode';

const SignDocument = () => {
  const [annotationManager, setAnnotationManager] = useState(null);
  const [annotPosition, setAnnotPosition] = useState(0);
  const [instance1, setInstance1] = useState('');
  const doc = useSelector(selectDocToSign);
  const user = useSelector(selectUser);
  const { docRef, docId } = doc;
  const { email } = user;

  const viewer = useRef(null);

  useEffect(() => {
    WebViewer(
      {
        path: 'webviewer',
        disabledElements: [
          'ribbons',
          'toggleNotesButton',
          'searchButton',
          'menuButton',
          // 'rubberStampToolGroupButton',
          // 'stampToolGroupButton',
          'fileAttachmentToolGroupButton',
          'calloutToolGroupButton',
          'undo',
          'signatureToolGroupButton',
          'toolsOverlay',
          'crossStampToolButton',
          'checkStampToolButton',
          'dotStampToolButton',
          'dateFreeTextToolButton',
          'redo',
          'eraserToolButton',
          'undoButton',
          'redoButton'
        ],
      },
      viewer.current,
    ).then(async (instance,type) => {
     setInstance1(instance)
      const { documentViewer,PDFNet,Tools,
        Annotations,
         annotationManager } = instance.Core;
      setAnnotationManager(annotationManager);
      await PDFNet.initialize();
        console.log(instance.Annotations)
      const storageRef = storage.ref();
      const URL = await storageRef.child(docRef).getDownloadURL();
      documentViewer.loadDocument(URL);

      const normalStyles = (widget) => {
        if (widget instanceof Annotations.TextWidgetAnnotation) {
          return {
            'background-color': '#a5c7ff',
            color: 'white',
          };
        } else if (widget instanceof Annotations.SignatureWidgetAnnotation) {
          return {
            border: '1px solid #a5c7ff',
          };
        }
      };








      const tool = documentViewer.getTool('AnnotationCreateRubberStamp');


      tool.setStandardStamps([
        'Approved',
        'AsIs',
        // 'https://www.dictionary.com/e/wp-content/uploads/2018/09/20200914_atw_20200914_atw_emoji_blueHeart_1000x700.png',\'
        'https://www.techopedia.com/images/uploads/aee977ce-f946-4451-8b9e-bba278ba5f13.jpg'
      ]);



      documentViewer.on('documentLoaded', () => {
        const stampAnnot = new Annotations.StampAnnotation();
        stampAnnot.PageNumber = 1;
        stampAnnot.X = 100;
        stampAnnot.Y = 250;
        stampAnnot.Width = 275;
        stampAnnot.Height = 40;
        const keepAsSVG = false;
        stampAnnot.setImageData('https://lh3.googleusercontent.com/a/ALm5wu2uFQLeUlXzwpgge35ZdUD2iz-SWpEWYSDHxqts8w=s96-c', keepAsSVG);
        stampAnnot.Author = annotationManager.getCurrentUser();
  
        annotationManager.addAnnotation(stampAnnot);
        annotationManager.redrawAnnotation(stampAnnot);
      })








      var ImageSelectTool = function(documentViewer) {
        Tools.RectangleCreateTool.apply(this, arguments);
      };
      ImageSelectTool.prototype = new Tools.RectangleCreateTool();
  
      var getPageCanvas = function(pageIndex) {
        return instance.iframeWindow.document.querySelector('#pageContainer' + pageIndex + ' .canvas' + pageIndex);
      };
  
      documentViewer.on("documentLoaded", function(event) {
        var imageSelectToolName = 'ImageSelect';
        var imageSelectTool = new ImageSelectTool(documentViewer);
  
        instance.registerTool({
          toolName: imageSelectToolName,
          toolObject: imageSelectTool,
          buttonImage: 'https://lh3.googleusercontent.com/a/ALm5wu2uFQLeUlXzwpgge35ZdUD2iz-SWpEWYSDHxqts8w=s96-c',
          buttonName: 'imageSelectToolButton',
          tooltip: 'Image selection'
        });
  
        instance.UI.setHeaderItems(function(header) {
          var imageSelectButton = {
            type: 'toolButton',
            toolName: imageSelectToolName,
            dataElement: 'imageSelectToolButton'
          };
          console.log("header")
          console.log(header)
          console.log("header")
          // header.get('.freeTextToolGroupButton').insertBefore(imageSelectButton);
          header.push(imageSelectButton);
        });
  
        imageSelectTool.on('annotationAdded', function(annotation) {
          var pageIndex = annotation.PageNumber;
          // get the canvas for the page
          var pageCanvas = getPageCanvas(pageIndex);
          var topOffset = parseFloat(pageCanvas.style.top) || 0;
          var leftOffset = parseFloat(pageCanvas.style.left) || 0;
          var zoom = documentViewer.getZoom() * instance.iframeWindow.utils.getCanvasMultiplier();
  
          var x = annotation.X * zoom - leftOffset;
          var y = annotation.Y * zoom - topOffset;
          var width = annotation.Width * zoom;
          var height = annotation.Height * zoom;
  
          var copyCanvas = document.createElement('canvas');
          copyCanvas.width = width;
          copyCanvas.height = height;
          var ctx = copyCanvas.getContext('2d');
          // copy the image data from the page to a new canvas so we can get the data URL
          ctx.drawImage(pageCanvas, x, y, width, height, 0, 0, width, height);
  
          // create a new stamp annotation that will have the image data that was under the rectangle
          var stampAnnot = new Annotations.StampAnnotation();
          stampAnnot.PageNumber = annotation.PageNumber;
          stampAnnot.X = annotation.X;
          stampAnnot.Y = annotation.Y;
          stampAnnot.Width = annotation.Width;
          stampAnnot.Height = annotation.Height;
          stampAnnot.Author = annotationManager.getCurrentUser();
          stampAnnot.ImageData = copyCanvas.toDataURL();
  
          annotationManager.addAnnotation(stampAnnot);
          annotationManager.selectAnnotation(stampAnnot);
          // we don't need the rectangle anymore so we can remove it
          annotationManager.deleteAnnotation(annotation);
        });
      });













      annotationManager.on('annotationChanged', (annotations, action, { imported }) => {
        if (imported && action === 'add') {
          annotations.forEach(function(annot) {
            if (annot instanceof Annotations.WidgetAnnotation) {
              Annotations.WidgetAnnotation.getCustomStyles = normalStyles;
              if (!annot.fieldName.startsWith(email)) {
                annot.Hidden = true;
                annot.Listable = false;
              }
            }
          });
        }
      });
    });
  }, [docRef, email]);

  const nextField = () => {
    let annots = annotationManager.getAnnotationsList();
    if (annots[annotPosition]) {
      annotationManager.jumpToAnnotation(annots[annotPosition]);
      if (annots[annotPosition+1]) {
        setAnnotPosition(annotPosition+1);
      }
    }
  }

  const prevField = () => {
    let annots = annotationManager.getAnnotationsList();
    if (annots[annotPosition]) {
      annotationManager.jumpToAnnotation(annots[annotPosition]);
      if (annots[annotPosition-1]) {
        setAnnotPosition(annotPosition-1);
      }
    }
  }

  const completeSigning = async () => {
    const xfdf = await annotationManager.exportAnnotations({ widgets: false, links: false });
    await updateDocumentToSign(docId, email, xfdf);
    navigate('/');
  }

  return (
      
    
    <div className={'prepareDocument'}>
      <Box display="flex" direction="row" flex="grow">
        <Column span={2}>
          <Box padding={3}>
            <Heading size="md">Sign Document</Heading>
          </Box>
          <Box padding={3}>
            <Row gap={1}>
              <Stack>
                <Box padding={2}>
                  <Button
                    onClick={nextField}
                    accessibilityLabel="next field"
                    text="Next field"
                    iconEnd="arrow-forward"
                  />
                </Box>
                <Box padding={2}>
                  <Button
                    onClick={prevField}
                    accessibilityLabel="Previous field"
                    text="Previous field"
                    iconEnd="arrow-back"
                  />
                </Box>
                <Box padding={2}>
                  <Button
                    onClick={completeSigning}
                    accessibilityLabel="complete signing"
                    text="Complete signing"
                    iconEnd="compose"
                  />
                </Box>
              </Stack>
            </Row>
          </Box>
        </Column>
        <Column span={10}>
          <div className="webviewer" ref={viewer}></div>
        </Column>
      </Box>
    </div>

  );
};

export default SignDocument;
