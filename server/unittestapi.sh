# API unit tests


# test post markup API
echo 'send 1 markup containing floor layout'
curl -H "Content-Type: application/json" -X POST -d '{"UserID":1, "sqrfoot": 1250.1, "json":"{\"0\":{\"measurementType\":3,\"id\":0,\"picks\":[null,{\"geomType\":0,\"snapNode\":null,\"geomVertex\":{\"x\":9.232900619506848,\"y\":15.544549646966386,\"z\":-0.03425499899250006},\"geomEdge\":null,\"geomFace\":null,\"radius\":0.09520716982046724,\"intersectPoint\":{\"x\":9.26707825453385,\"y\":15.55784236433894,\"z\":-0.03425499899250006},\"faceNormal\":null,\"viewportIndex2d\":2,\"circularArcCenter\":null,\"circularArcRadius\":null,\"fromTopology\":false,\"isPerpendicular\":false,\"id\":1},{\"geomType\":0,\"snapNode\":null,\"geomVertex\":{\"x\":17.292051315307617,\"y\":15.544549942016602,\"z\":-0.03425499899250006},\"geomEdge\":null,\"geomFace\":null,\"radius\":0.09520716982046724,\"intersectPoint\":{\"x\":17.264480777408764,\"y\":15.538800930008195,\"z\":-0.03425499899250006},\"faceNormal\":null,\"viewportIndex2d\":2,\"circularArcCenter\":null,\"circularArcRadius\":null,\"fromTopology\":false,\"isPerpendicular\":false,\"id\":2},{\"geomType\":0,\"snapNode\":null,\"geomVertex\":{\"x\":12.873733520507812,\"y\":8.671208381652832,\"z\":-0.03425499899250006},\"geomEdge\":null,\"geomFace\":null,\"radius\":0.09520716982046724,\"intersectPoint\":{\"x\":12.846867955249289,\"y\":8.683884570939714,\"z\":-0.03425499899250006},\"faceNormal\":null,\"viewportIndex2d\":2,\"circularArcCenter\":null,\"circularArcRadius\":null,\"fromTopology\":false,\"isPerpendicular\":false,\"id\":3},null],\"closedArea\":true,\"angle\":0,\"distanceX\":0,\"distanceY\":0,\"distanceZ\":0,\"distanceXYZ\":0,\"result\":{\"area\":1532880.863219224,\"type\":3},\"area\":1532880.863219224}}"}' http://localhost:3000/savemarkup


echo 'get all markup'
curl http://localhost:3000/allMarkup?approvalid=1


echo 'get markup id=1'
curl http://localhost:3000/markup?markupID=1
