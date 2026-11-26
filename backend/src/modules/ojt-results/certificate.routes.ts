import { Router, type Request } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { invalid, positiveId } from '../students/student.validation';
import { getAssignmentCertificate, readCertificateFile, receiveCertificate, studentCertificates, uploadCertificate } from './certificate.service';

const router = Router();
const actor = (req: Request) => ({userId:req.user!.userId,roleCode:req.user!.roleCode!});
const staff = [authenticate, authorizeRoles('ENTERPRISE','OJT_COORD','ADMIN')];
router.get('/internships/:id/certificate', ...staff, async (req,res,next) => {
  try { res.json({success:true,data:await getAssignmentCertificate(positiveId(req.params.id), actor(req))}); } catch(error) { next(error); }
});
router.put('/internships/:id/certificate', ...staff, receiveCertificate, async (req,res,next) => {
  try {
    if(Object.keys(req.query).length) throw invalid('API tải chứng chỉ không nhận query.');
    res.json({success:true,data:await uploadCertificate(positiveId(req.params.id),req.file!,actor(req))});
  } catch(error) { next(error); }
});
router.get('/students/me/ojt-certificates', authenticate, authorizeRoles('STUDENT'), async (req,res,next) => {
  try {
    if(Object.keys(req.query).some(key=>key!=='ojtSemesterId')) throw invalid('Tham số chứng chỉ không hợp lệ.');
    res.json({success:true,data:await studentCertificates(positiveId(req.query.ojtSemesterId,'ojtSemesterId'),actor(req))});
  } catch(error) { next(error); }
});
router.get('/ojt-certificates/:id/file', authenticate, authorizeRoles('STUDENT','ENTERPRISE','OJT_COORD','ADMIN'), async (req,res,next) => {
  try {
    const file = await readCertificateFile(positiveId(req.params.id),actor(req));
    res.setHeader('Content-Type',file.MimeType);
    res.setHeader('Content-Disposition',`attachment; filename="ojt-certificate"; filename*=UTF-8''${encodeURIComponent(file.FileName).replace(/'/g,'%27')}`);
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.send(file.Content);
  } catch(error) { next(error); }
});
export default router;
