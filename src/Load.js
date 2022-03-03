import React from "react";
import SampleButton from './SampleButton';

const Load = ({ handleUpload, loadHalfling, loadKennedy, loadAlAni, loadShakespeare, loadTudor, loadGOT, loadKardashian, showError }) => {
  return (
    <div id='load'>
      <div>
        <section>
          <h1>Family Constellation</h1>
          {/* { <h3>A journey through heritage</h3> } */}
          <h3>By Maysam Al-Ani</h3>
        </section>

        <section className='button-area'>
          {/* <p>View blood samples</p> */}
          <SampleButton
          name={'Start'}
          loadFile={loadAlAni}
          />
          {/* <SampleButton
          name={'Kardashian'}
          loadFile={loadKardashian}
          />
          <SampleButton
            name={'Kennedy'}
            loadFile={loadKennedy}
          />
          <SampleButton
          name={'Halfling'}
          loadFile={loadHalfling}
          />
          <SampleButton
            name={'Tudor'}
            loadFile={loadTudor}
          /> */}
        </section> 

        {/* <section>
          { <p>Upload a GEDCOM (.ged) file</p> }
          { showError ? <p className='error'>File type not supported. Please use a .ged file.</p> : null}
          <input id='file-input' className='form-control' type='file' name='gedFile' onChange={handleUpload} />
        </section>

        { <section className='links'>
          <p><a href='https://github.com/mister-blanket/blood-lines'>Documentation</a></p>
          <p><a href='https://mrplunkett.com'>Mr. Plunkett</a></p>
        </section> } */}
      </div>
    </div>
  )
}

export default Load;
