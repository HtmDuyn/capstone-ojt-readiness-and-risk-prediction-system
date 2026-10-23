import PDFDocument from 'pdfkit';
import path from 'node:path';
import { resultApi } from './result.service';

// Source assets are copied to dist/assets by the build script.
export async function resultPdf(items:ReturnType<typeof resultApi>[], semesterId:number):Promise<Buffer> {
  const doc=new PDFDocument({size:'A4',margin:42,bufferPages:true,info:{Title:`Kết quả OJT - kỳ ${semesterId}`}});
  const chunks:Buffer[]=[];
  const completed=new Promise<Buffer>((resolve,reject)=>{
    doc.on('data',(chunk:Buffer)=>chunks.push(chunk));
    doc.on('end',()=>resolve(Buffer.concat(chunks)));
    doc.on('error',reject);
  });
  doc.font(path.resolve(__dirname,'../../assets/fonts/NotoSans-Regular.ttf'));
  const header=()=>{
    doc.fontSize(17).text('BÁO CÁO KẾT QUẢ OJT');
    doc.fontSize(10).text(`Kỳ OJT: ${semesterId} | Tổng hồ sơ: ${items.length}`);
    doc.moveDown();
  };
  header();
  if(!items.length)doc.fontSize(11).text('Không có kết quả phù hợp với bộ lọc.');
  for(const item of items){
    const lines=[`${item.studentCode} - ${item.fullName}`,`Doanh nghiệp: ${item.enterpriseName}`,
      `Kỳ: ${item.semesterCode} | Mã kết quả: ${item.id}`,
      `Trạng thái: ${item.status}`,`Điểm chính thức: ${item.officialScore ?? '-'} | Kết quả: ${item.outcome ?? '-'}`];
    doc.fontSize(10);
    const height=lines.reduce((sum,line)=>sum+doc.heightOfString(line,{width:511}),0)+16;
    if(doc.y+height>doc.page.height-60){doc.addPage();header();doc.fontSize(10);}
    for(const line of lines)doc.text(line,{width:511});
    doc.moveDown();
  }
  const pages=doc.bufferedPageRange();
  for(let i=0;i<pages.count;i++){
    doc.switchToPage(i);
    doc.fontSize(9).text(`Trang ${i+1} / ${pages.count}`,42,doc.page.height-40,{lineBreak:false});
  }
  doc.end();
  return completed;
}
