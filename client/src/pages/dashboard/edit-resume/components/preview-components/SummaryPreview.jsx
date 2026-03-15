import React from 'react'

function SummeryPreview({resumeInfo}) {
  return (
    <p className='text-xs'>
        {resumeInfo?.summary || resumeInfo?.summery}
    </p>
  )
}

export default SummeryPreview