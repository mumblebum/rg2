/*global rg2:false */
(function () {
  // gets an OOM PDF file and extracts control information from the hidden text
  function OOMCourseParser(evt, worldfile, localWorldfile) {
    this.courses = [];
    this.courseClassMapping = [];
    this.newcontrols = new rg2.Controls();
    this.courses.length = 0;
    this.courseClassMapping.length = 0;
    this.newcontrols.deleteAllControls();
    // holding copies of worldfiles: not ideal but it works
    this.localWorldfile = localWorldfile;
    this.worldfile = worldfile;
    this.processCoursePDF(evt.target.result);


  }

  OOMCourseParser.prototype = {

    Constructor: OOMCourseParser,

    processCoursePDF: function (rawPDF) {
      try {
        var getPDF = pdfjsLib.getDocument(rawPDF);

        getPDF.promise.then(function (pdf) {
          pdf.getPage(1)
            .then(function (page) {
              page.getTextContent()
                .then(function (textContent) {
                  if (!textContent.items) {
                    console.log('No text found');
                    return;
                  }
                  var i, data;
                  controls = [];
                  for (i = 0; i < textContent.items.length; i++) {
                    if (textContent.items[i].str.startsWith('style=')) {
                      data = textContent.items[i].str.split('|');
                    }
                  }
                  if (!data) {
                    console.log('No data found');
                    return;
                  }
                  this.processOOMCourse(data);
                  return { courses: this.courses, newcontrols: this.newcontrols, mapping: this.courseClassMapping, georeferenced: true };
                })
            })
        });

      } catch (err) {
        rg2.utils.showWarningDialog("OOM PDF file error", "File is not a valid OOM PDF file.");
        return;
      }
    },

    processOOMCourse: function (data) {
      var i, codes, x, y, control, controlData, startData;
      codes = [];
      x = [];
      y = [];
      for (var i = 0; i < data.length; i++) {
        if (data[i].startsWith('start=')) {
          // save start location
          startData = data[i].replace('start=', '').split(',');
          codes.push("S");
          x.push(parseInt(startData[0], 10));
          y.push(parseInt(startData[1], 10));
          // start and finish always at same in OOM place at present
          codes.push("F");
          x.push(parseInt(startData[0], 10));
          y.push(parseInt(startData[1], 10));
        }
        if (data[i].startsWith('controls=')) {
          controlData = data[i].replace('controls=', '').split(',');
        }
      }
      control = {};
      // controlData looks like ["1", "45", "6754545", "-33417", "2", "45", "6754858", "-33517", ...]
      while (controlData.length > 3) {
        codes.push(controlData[0]);
        x.push(parseInt(controlData[2], 10));
        push(parseInt(controlData[3], 10));
        // remove four elements from array
        controlData.splice(0, 4);
      };

      this.courses.push({ courseid: 0, x: x, y: y, codes: codes, name: "Score" });
      for (i = 0; i < codes.length; i++) {
        control = {};
        control.code = codes[i];
        control.x = x[i];
        control.y = y[i];
        this.newcontrols.push(control);
      }
    },

    getXYFromLatLng: function (latLng) {
      var lat, lng, pt;
      pt = { x: 0, y: 0 };
      lat = parseFloat(latLng[0].getAttribute('lat'));
      lng = parseFloat(latLng[0].getAttribute('lng'));
      // handle Condes-specific georeferencing
      if (this.fromCondes) {
        // use original map worldfile
        pt.x = this.localWorldfile.getX(lng, lat);
        pt.y = this.localWorldfile.getY(lng, lat);
      } else {
        // use WGS-84 worldfile as expected (?) by IOF V3 schema
        pt.x = this.worldfile.getX(lng, lat);
        pt.y = this.worldfile.getY(lng, lat);
      }
      return pt;
    },
  };
  rg2.OOMCourseParser = OOMCourseParser;
}());