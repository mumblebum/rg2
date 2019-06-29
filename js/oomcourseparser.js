/*global rg2:false */
(function () {
  // gets an OOM PDF file and extracts control information from the hidden text
  function OOMCourseParser(localWorldfile) {
    this.courses = [];
    this.courseClassMapping = [];
    this.newcontrols = new rg2.Controls();
    this.courses.length = 0;
    this.courseClassMapping.length = 0;
    this.newcontrols.deleteAllControls();
    this.localWorldfile = localWorldfile;
  }

  OOMCourseParser.prototype = {

    Constructor: OOMCourseParser,

    // takes text extracted from an OOM map
    processCoursePDF: function (textContent) {
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
    },

    processOOMCourse: function (data) {
      var i, codes, x, y, controlData, startData;
      codes = [];
      x = [];
      y = [];
      for (var i = 0; i < data.length; i++) {
        if (data[i].startsWith('start=')) {
          // save start location
          startData = data[i].replace('start=', '').split(',');
          codes.push("S");
          x.push(this.localWorldfile.getX(startData[1], startData[0]));
          y.push(this.localWorldfile.getY(startData[1], startData[0]));
          // start and finish always at same in OOM place at present
          codes.push("F");
          x.push(this.localWorldfile.getX(startData[1], startData[0]));
          y.push(this.localWorldfile.getY(startData[1], startData[0]));
        }
        if (data[i].startsWith('controls=')) {
          controlData = data[i].replace('controls=', '').split(',');
        }
      }

      // controlData looks like ["1", "45", "6754545", "-33417", "2", "45", "6754858", "-33517", ...]
      while (controlData.length > 3) {
        codes.push(controlData[0]);
        x.push(this.localWorldfile.getX(controlData[3], controlData[2]));
        y.push(this.localWorldfile.getY(controlData[3], controlData[2]));
        // remove four elements from array
        controlData.splice(0, 4);
      };

      this.courses.push({ courseid: 0, x: x, y: y, codes: codes, name: "Score" });
      for (i = 0; i < codes.length; i++) {
        this.newcontrols.addControl(codes[i], x[i], y[i]);
      }
    }

  };
  rg2.OOMCourseParser = OOMCourseParser;
}());