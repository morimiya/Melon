
import { _decorator, Component, Node, CCClass, SpriteFrame, CCInteger, instantiate, Prefab, CircleCollider2D, Vec3, log, EventTouch, Vec2, director, PhysicsSystem2D, EPhysics2DDrawFlags, PHYSICS_2D_PTM_RATIO, UITransform, utils, tween, RigidBody2D, ERigidBody2DType, Collider2D, Sprite, math, ParticleSystem2D, AudioClip, AudioSource, Label, spriteAssembler } from 'cc';
import { Fruit } from "./Fruit"
const { ccclass, property } = _decorator;

@ccclass("FruitItem")
export class FruitItem {
    @property({type: CCInteger})
	public id: number = 1;
    @property({type: SpriteFrame})
    public img: SpriteFrame = null!;
}

@ccclass("JuiceItem")
class JuiceItem {
    @property({type: SpriteFrame})
    public juiceSF: SpriteFrame = null!;
    @property({type: SpriteFrame})
    public sarcocarpSF: SpriteFrame = null!;
    @property({type: SpriteFrame})
    public dewdropSF: SpriteFrame = null!;
}

@ccclass('GameManager')
export class GameManager extends Component {

    @property({type: Label})
    public scoreLabel: Label = null!;
    @property({type: Label})
    public warnlineLabel: Label = null!;

    @property({type: Prefab})
    public fruitPrefab: Prefab = null!;
    @property({type: FruitItem})
	public fruits: FruitItem[] = [];

    @property({type: Prefab})
    public juicePrefab: Prefab = null!;
    @property({type: JuiceItem})
	public juices: JuiceItem[] = [];

    @property({type: AudioClip})
	public boomAudio: AudioClip = null!;
    @property({type: AudioClip})
	public waterAudio: AudioClip = null!;

    private curFruit: any = null;
    private curWarnlineFruit: any = null;
    private lastWarnlineFruitPos: Vec3 = new Vec3(0, 0, 0);
    private warnlineFruitLastTime: number = 0;

    private isCreating: boolean = false;
    private isMoving: boolean = false;
    private score: number = 0;

    private combineList: any[] = [];

    onLoad() {
        this.initPhysics()

        this.isCreating = false;
        this.isMoving = false;
        this.score = 0;

        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

        this.initOneFruit()
    }

    start () {
        log("Start");
    }

    initPhysics() {
        const system = PhysicsSystem2D.instance;
        system.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
                                                EPhysics2DDrawFlags.Pair |
                                                EPhysics2DDrawFlags.CenterOfMass |
                                                EPhysics2DDrawFlags.Joint |
                                                EPhysics2DDrawFlags.Shape;
        
        system.gravity = new Vec2(0, -20 * PHYSICS_2D_PTM_RATIO);

        // 物理步长，默认 fixedTimeStep 是 1/60
        system.fixedTimeStep = 1/60;
        // 每次更新物理系统处理速度的迭代次数，默认为 10
        system.velocityIterations = 8;
        // 每次更新物理系统处理位置的迭代次数，默认为 10
        system.positionIterations = 8;
    }

    initOneFruit() {
        this.curFruit = this.createOneFruit(0, 400, 1);
    }

    getNextFruitId() {
        // return 2;
        return Math.floor(Math.random() * 5) + 1
    }

    createOneFruit(x: number, y: number, iFruitID: number) {
        let oFruit = instantiate(this.fruitPrefab);
        const config = this.fruits[iFruitID - 1];
        
        let fruitComponent = oFruit.getComponent(Fruit);
        if (fruitComponent) {
            fruitComponent.init({
                id: config.id,
                img: config.img
            });
        }
        
        let rigidBody2D = oFruit.getComponent(RigidBody2D);
        if (rigidBody2D)
            rigidBody2D.type = ERigidBody2DType.Static;

        let collider2D = oFruit.getComponent(CircleCollider2D);
        if (collider2D) {
            collider2D.enabled = false;
            collider2D.apply();
        }
        
        oFruit.setPosition(new Vec3(x, y, 0));
        this.node.addChild(oFruit);

        oFruit.on('sameContact', this.onSameContact, this);

        return oFruit;
    }

    enablePhysics(oFruit: Node) {
        let rigidBody2D = oFruit.getComponent(RigidBody2D);
        if (rigidBody2D)
            rigidBody2D.type = ERigidBody2DType.Dynamic;
        
        let collider2D = oFruit.getComponent(CircleCollider2D);
        if (collider2D) {
            collider2D.enabled = true;
            let uiTransform = oFruit.getComponent(UITransform);
            if (uiTransform) {
                collider2D.radius = uiTransform.contentSize.width / 2;
                collider2D.apply();
            }
        }
    }

    enableFruitContactWarnline(oFruit: Node) {
        oFruit.on('warnlineContact', this.onSameContact, this);
    }

    showJuice(x: number, y: number, iFruitID: number) {
        let oJuice = instantiate(this.juicePrefab);
        oJuice.setPosition(new Vec3(x, y, 0));
        const config = this.juices[iFruitID - 1];
        let sprite = oJuice.getComponent(Sprite);
        oJuice.setScale(new Vec3(0.4 * Math.pow(1.2, iFruitID - 1), 0.4 * Math.pow(1.2, iFruitID - 1), 1));
        if (sprite) {
            sprite.spriteFrame = config.juiceSF;
        }
        let sarcocarp = oJuice.getChildByName("sarcocarp");
        if (sarcocarp) {
            let particle2D = sarcocarp.getComponent(ParticleSystem2D);
            if (particle2D) {
                particle2D.spriteFrame = config.sarcocarpSF;
                particle2D.startSize = 20 * Math.pow(1.2, iFruitID - 1);
                particle2D.endSize = 2 * Math.pow(1.2, iFruitID - 1);
            }
        }
        let dewdrop = oJuice.getChildByName("dewdrop");
        if (dewdrop) {
            let particle2D = dewdrop.getComponent(ParticleSystem2D);
            if (particle2D) {
                particle2D.spriteFrame = config.dewdropSF;
                particle2D.startSize = 20 * Math.pow(1.2, iFruitID - 1);
                particle2D.endSize = 4 * Math.pow(1.2, iFruitID - 1);
            }
        }

        this.node.addChild(oJuice);

        this.scheduleOnce(() => {
            oJuice.destroy();
        }, 1);
    }

    addScore(iFruitID: number) {
        this.score += iFruitID;
        if (iFruitID === 10) {
            this.score += 100;
        }
        if (this.scoreLabel) {
            this.scoreLabel.string = '' + this.score;
        }
    }

    gameEnd() {
        this.node.children.forEach(element => {
            if (element.name == "fruit" && element != this.curFruit) {
                let pos = element.getPosition();
                let iFruitID = element.getComponent(Fruit)?.getID();
                if (iFruitID) {
                    element.active = false;
                    element.destroy();
                    this.addScore(iFruitID);
                    this.showJuice(pos.x, pos.y, iFruitID);
                }
            }
        });
        this.curWarnlineFruit = null;
    }

    onTouchStart(event: EventTouch) {
        if (this.isCreating)
            return;
        if (this.isMoving)
            return;
        this.isMoving = true;
        const pos = event.getUILocation();    // letf-bottom pos.
        let x = pos.x;
        let uiTransform = this.getComponent(UITransform);
        if (uiTransform) {
            x -= uiTransform.width / 2;
        }
        tween(this.curFruit)
            .to(0.1, {position: new Vec3(x, 400, 0)}, { easing: 'cubicIn', 'onComplete': (oFruit: any) => {
                this.isMoving = false;
            }})
            .start();
    }

    onTouchMove(event: EventTouch) {
        if (this.isCreating)
            return;
        if (this.isMoving)
            return;
        if (this.curFruit != null) {
            const pos = event.getUILocation();    // letf-bottom pos.
            let x = pos.x;
            let uiTransform = this.getComponent(UITransform);
            if (uiTransform) {
                x -= uiTransform.width / 2;
            }
            this.curFruit.setPosition(new Vec3(x, 400, 0));
        }
    }

    onTouchEnd(event: EventTouch) {
        if (this.isCreating)
            return;
        if (this.curFruit === null)
            return;
        tween(this.curFruit).stop();
        this.isMoving = false;
        
        const pos = event.getUILocation();    // letf-bottom pos.
        let x = pos.x;
        let uiTransform = this.getComponent(UITransform);
        if (uiTransform) {
            x -= uiTransform.width / 2;
        }
        this.curFruit.setPosition(new Vec3(x, 400, 0));
        this.enablePhysics(this.curFruit);
        this.curFruit = null;
        this.isCreating = true;
        this.scheduleOnce(() => {
            this.curFruit = this.createOneFruit(0, 400, this.getNextFruitId());
            this.isCreating = false;
        }, 0.6);
    }

    onSameContact(selfCollider: Collider2D, otherCollider: Collider2D) {
        console.log("---onSameContact");
        if ((selfCollider.node === this.curFruit) || (otherCollider.node == this.curFruit))
            return;
        let oSelfFruit = selfCollider.node.getComponent(Fruit);
        let iFruitID = 0;
        if (oSelfFruit)
            iFruitID = oSelfFruit.getID();
        if (iFruitID < 11) {
            this.combineList.push({
                nodeA: selfCollider.node,
                nodeB: otherCollider.node
            });
        }
    }

    lateUpdate(deltaTime: number) {
        this.combineList.forEach(element => {
            if (element.nodeA.isValid && element.nodeB.isValid && element.nodeA.active && element.nodeB.active) {
                let oSelfFruit = element.nodeA.getComponent(Fruit);
                let iFruitID = 0;
                if (oSelfFruit)
                    iFruitID = oSelfFruit.getID();
                
                const {x, y} = element.nodeB.getPosition();
                
                element.nodeA.active = false;
                element.nodeB.active = false;

                element.nodeA.destroy();
                element.nodeB.destroy();
        
                this.addScore(iFruitID);
        
                const nextId = iFruitID + 1;
                if (nextId <= 11) {
                    let oFruit = this.createOneFruit(x, y, nextId);
                    this.enablePhysics(oFruit);
                    this.showJuice(x, y - 6, iFruitID);
                    this.getComponent(AudioSource)?.playOneShot(this.waterAudio, 1);
                    this.getComponent(AudioSource)?.playOneShot(this.boomAudio, 0.2);
                    
                    oFruit.setScale(new Vec3(0.4, 0.4, 1));
                    tween(oFruit)
                        .to(0.5, {scale: new Vec3(1, 1, 1)}, { easing: 'backOut'})
                        .start();
                }
            }
        });
        if (this.combineList.length > 0) {
            this.combineList = [];
            this.curWarnlineFruit = null;
            this.warnlineFruitLastTime = 0;
        }
        else {
            let warnY = this.warnlineLabel.node.getPosition().y;
            if (this.curWarnlineFruit != null && this.curWarnlineFruit != this.curFruit) {
                let pos = this.curWarnlineFruit.getPosition().subtract(this.lastWarnlineFruitPos);
                if (pos.length() < 1) {
                    this.warnlineFruitLastTime += 1;
                    if (this.warnlineFruitLastTime > 90) {
                        this.gameEnd();
                    }
                }
                else {
                    this.curWarnlineFruit = null;
                    this.warnlineFruitLastTime = 0;
                }
            }
            else {
                this.curWarnlineFruit = null;
                this.warnlineFruitLastTime = 0;
                this.node.children.forEach(element => {
                    if (element.name == "fruit" && element != this.curFruit) {
                        let pos = element.getPosition();
                        let uiTransform = element.getComponent(UITransform);
                        if (uiTransform) {
                            const h = uiTransform.contentSize.height;
                            if (pos.y + (h / 2) > warnY) {
                                this.curWarnlineFruit = element;
                                this.lastWarnlineFruitPos = pos;
                            }
                        }
                    }
                });
            }
        }
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.0/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.0/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.0/manual/en/scripting/life-cycle-callbacks.html
 */
